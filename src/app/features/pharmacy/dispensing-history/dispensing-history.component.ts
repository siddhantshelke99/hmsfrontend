import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { PharmacyService } from '../services/pharmacy.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
import { NotificationService } from '@app/common/services/notification.service';
import { LoaderComponent } from '@app/common/components/loader/loader.component';
import { DispensingHistory } from '../models/pharmacy.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-dispensing-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './dispensing-history.component.html',
  styleUrls: ['./dispensing-history.component.scss']
})
export class DispensingHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  filterForm: FormGroup;
  historyRecords: DispensingHistory[] = [];
  isLoading = false;
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;

  // Filters
  dispensingStatuses = ['COMPLETED', 'PARTIAL', 'CANCELLED'];
  paymentStatuses = ['COMPLETED', 'PENDING', 'REFUNDED'];
  paymentMethods = ['CASH', 'UPI', 'CARD', 'FREE'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private pharmacyService: PharmacyService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      startDate: [this.getDefaultStartDate()],
      endDate: [this.getDefaultEndDate()],
      dispensingStatus: [''],
      paymentStatus: [''],
      paymentMethod: [''],
      dispensedBy: [''],
      showReturns: [false]
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.PHARMACY,
      undefined,
      'Accessed Dispensing History'
    );

    // Setup search debounce
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadHistory();
      });

    // Setup other filters
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadHistory();
      });

    // Initial load
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadHistory(): void {
    this.isLoading = true;

    const filters = {
      ...this.filterForm.value,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.pharmacyService.getDispensingHistory(filters).subscribe({
      next: (response) => {
        this.historyRecords = response.history;
        this.totalRecords = response.total;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.notificationService.error(
          'Error',
          'Failed to load dispensing history'
        );
        this.isLoading = false;
      }
    });
  }

  viewDetails(record: DispensingHistory): void {
    this.router.navigate(['/pharmacy/history', record.id]);
  }

  reprintLabel(record: DispensingHistory): void {
    Swal.fire({
      title: 'Reprint Medicine Labels?',
      text: `Do you want to reprint labels for prescription ${record.prescriptionNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Print',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#007bff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.printLabels(record);
      }
    });
  }

  printLabels(record: DispensingHistory): void {
    // In a real application, this would generate and print medicine labels
    // For now, we'll just show a success message
    this.auditLogService.logAction(
      AuditAction.UPDATE,
      AuditModule.PHARMACY,
      record.id,
      `Reprinted labels for prescription ${record.prescriptionNumber}`
    );

    this.notificationService.success(
      'Labels Printed',
      'Medicine labels sent to printer'
    );
  }

  viewPrescription(record: DispensingHistory): void {
    this.router.navigate(['/prescriptions/details', record.prescriptionId]);
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      searchTerm: '',
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      dispensingStatus: '',
      paymentStatus: '',
      paymentMethod: '',
      dispensedBy: '',
      showReturns: false
    });
  }

  exportToExcel(): void {
    // In a real application, this would export the data to Excel
    // For now, we'll just show a message
    Swal.fire({
      title: 'Export to Excel',
      text: 'Exporting dispensing history...',
      icon: 'info',
      timer: 2000,
      showConfirmButton: false
    });

    this.auditLogService.logAction(
      AuditAction.UPDATE,
      AuditModule.PHARMACY,
      undefined,
      'Exported dispensing history to Excel'
    );
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadHistory();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadHistory();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHistory();
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'COMPLETED': 'bg-success',
      'PARTIAL': 'bg-warning',
      'CANCELLED': 'bg-danger',
      'PENDING': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  getPaymentStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'COMPLETED': 'text-success',
      'PENDING': 'text-warning',
      'REFUNDED': 'text-danger'
    };
    return classes[status] || 'text-secondary';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
