import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { LoaderComponent } from '@app/common';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PrescriptionService } from '../services/prescription.service';
import { Prescription, PrescriptionItem, PrescriptionStatus, DispensingStatus } from '../models/prescription.model';

@Component({
  selector: 'app-prescription-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './prescription-details.component.html',
  styleUrls: ['./prescription-details.component.scss']
})
export class PrescriptionDetailsComponent implements OnInit, OnDestroy {
  prescription: Prescription | null = null;
  isLoading = false;
  prescriptionId!: string;

  PrescriptionStatus = PrescriptionStatus;
  DispensingStatus = DispensingStatus;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit(): void {
    this.prescriptionId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.prescriptionId) {
      this.loadPrescription();
    } else {
      this.notificationService.error('Invalid ID', 'Invalid prescription ID');
      this.router.navigate(['/prescriptions/list']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPrescription(): void {
    this.isLoading = true;
    
    this.prescriptionService.getPrescriptionById(this.prescriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescription) => {
          this.prescription = prescription;
          this.isLoading = false;
          this.logAudit(
            AuditAction.VIEW,
            `Viewed prescription: ${prescription.prescriptionNumber} for patient ${prescription.patientRegistrationNumber}`
          );
        },
        error: (error) => {
          this.notificationService.error('Failed to load prescription', error.message);
          this.isLoading = false;
          this.router.navigate(['/prescriptions/list']);
        }
      });
  }

  printPrescription(): void {
    window.print();
    this.logAudit(AuditAction.VIEW, `Printed prescription: ${this.prescription?.prescriptionNumber}`);
  }

  cancelPrescription(): void {
    if (!this.prescription) return;

    Swal.fire({
      title: 'Cancel Prescription?',
      html: `
        <p>Are you sure you want to cancel this prescription?</p>
        <p><strong>Prescription:</strong> ${this.prescription.prescriptionNumber}</p>
        <p><strong>Patient:</strong> ${this.prescription.patientName}</p>
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
        this.prescriptionService.cancelPrescription(this.prescriptionId, result.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Success', 'Prescription cancelled successfully');
              this.logAudit(
                AuditAction.UPDATE,
                `Cancelled prescription: ${this.prescription?.prescriptionNumber} - Reason: ${result.value}`
              );
              this.loadPrescription(); // Reload to show updated status
            },
            error: (error) => {
              this.notificationService.error('Failed to cancel prescription', error.message);
              this.isLoading = false;
            }
          });
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/prescriptions/list']);
  }

  getDosageText(item: PrescriptionItem): string {
    const parts: string[] = [];
    
    if (item.dosage.morning) {
      parts.push(`${item.dosage.morning} (Morning)`);
    }
    if (item.dosage.afternoon) {
      parts.push(`${item.dosage.afternoon} (Afternoon)`);
    }
    if (item.dosage.evening) {
      parts.push(`${item.dosage.evening} (Evening)`);
    }
    if (item.dosage.night) {
      parts.push(`${item.dosage.night} (Night)`);
    }
    
    return parts.join(' - ') || 'As directed';
  }

  getFoodTimingText(item: PrescriptionItem): string {
    const timings: string[] = [];
    
    if (item.beforeFood) timings.push('Before food');
    if (item.afterFood) timings.push('After food');
    if (item.withFood) timings.push('With food');
    if (item.sos) timings.push('SOS (If needed)');
    
    return timings.join(', ') || 'As directed';
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

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PRESCRIPTION,
      'Prescription',
      this.prescriptionId || '',
      details
    ).subscribe();
  }
}
