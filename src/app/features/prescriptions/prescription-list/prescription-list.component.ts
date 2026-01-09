import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import Swal from 'sweetalert2';

import { LoaderComponent } from '@app/common';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PrescriptionService } from '../services/prescription.service';
import {
  PrescriptionSummary,
  PrescriptionFilter,
  PrescriptionStatus,
  DispensingStatus
} from '../models/prescription.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.scss']
})
export class PrescriptionListComponent implements OnInit, OnDestroy {
  prescriptions: PrescriptionSummary[] = [];
  filteredPrescriptions: PrescriptionSummary[] = [];
  isLoading = false;
  
  filterForm!: FormGroup;
  
  prescriptionStatuses = Object.values(PrescriptionStatus);
  dispensingStatuses = Object.values(DispensingStatus);
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadPrescriptions();
    this.setupFilterSubscription();
    this.logAudit(AuditAction.ACCESS, 'Accessed prescription list');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterForm = this.fb.group({
      startDate: [thirtyDaysAgo.toISOString().split('T')[0]],
      endDate: [today.toISOString().split('T')[0]],
      status: [''],
      dispensingStatus: [''],
      searchTerm: [''],
      prescriptionNumber: ['']
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadPrescriptions();
      });
  }

  loadPrescriptions(): void {
    this.isLoading = true;
    const filter: PrescriptionFilter = this.filterForm.value;

    this.prescriptionService.getPrescriptionList(filter, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.prescriptions = response.prescriptions;
          this.filteredPrescriptions = response.prescriptions;
          this.totalRecords = response.total;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to load prescriptions', error.message);
          this.isLoading = false;
        }
      });
  }

  createPrescription(): void {
    this.router.navigate(['/prescriptions/create']);
  }

  viewPrescription(prescriptionId: string): void {
    this.router.navigate(['/prescriptions/details', prescriptionId]);
  }

  printPrescription(prescriptionId: string, event: Event): void {
    event.stopPropagation();
    this.prescriptionService.printPrescription(prescriptionId);
    this.logAudit(AuditAction.VIEW, `Printed prescription: ${prescriptionId}`);
  }

  cancelPrescription(prescription: PrescriptionSummary, event: Event): void {
    event.stopPropagation();

    Swal.fire({
      title: 'Cancel Prescription?',
      html: `
        <p>Are you sure you want to cancel this prescription?</p>
        <p><strong>Prescription:</strong> ${prescription.prescriptionNumber}</p>
        <p><strong>Patient:</strong> ${prescription.patientName}</p>
      `,
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Enter reason for cancelling this prescription...',
      inputValidator: (value) => {
        if (!value) {
          return 'Please provide a reason for cancellation';
        }
        return null;
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Prescription',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'No, Keep It'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.isLoading = true;
        this.prescriptionService.cancelPrescription(prescription.id, result.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Success', 'Prescription cancelled successfully');
              this.logAudit(
                AuditAction.UPDATE,
                `Cancelled prescription: ${prescription.prescriptionNumber} - Reason: ${result.value}`
              );
              this.loadPrescriptions();
            },
            error: (error) => {
              this.notificationService.error('Failed to cancel prescription', error.message);
              this.isLoading = false;
            }
          });
      }
    });
  }

  getStatusBadgeClass(status: PrescriptionStatus): string {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'bg-success';
      case PrescriptionStatus.DRAFT:
        return 'bg-secondary';
      case PrescriptionStatus.DISPENSED:
        return 'bg-primary';
      case PrescriptionStatus.PARTIALLY_DISPENSED:
        return 'bg-info';
      case PrescriptionStatus.CANCELLED:
        return 'bg-danger';
      case PrescriptionStatus.EXPIRED:
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getDispensingStatusBadgeClass(status: DispensingStatus): string {
    switch (status) {
      case DispensingStatus.FULLY_DISPENSED:
        return 'bg-success';
      case DispensingStatus.PENDING:
        return 'bg-warning';
      case DispensingStatus.IN_PROGRESS:
        return 'bg-info';
      case DispensingStatus.PARTIALLY_DISPENSED:
        return 'bg-warning';
      case DispensingStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  resetFilters(): void {
    this.filterForm.reset({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: '',
      dispensingStatus: '',
      searchTerm: '',
      prescriptionNumber: ''
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPrescriptions();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPrescriptions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPrescriptions();
    }
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  exportToCSV(): void {
    // Implement CSV export functionality
    this.notificationService.info('Coming Soon', 'CSV export functionality will be implemented');
  }

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PRESCRIPTION,
      'Prescription',
      '',
      details
    ).subscribe();
  }
}
