import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';

import { LoaderComponent } from '@app/common';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PharmacyService } from '../services/pharmacy.service';
import {
  DispensingQueue,
  DispensingQueueStatus,
  QueuePriority
} from '../models/pharmacy.model';

@Component({
  selector: 'app-dispensing-queue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent],
  templateUrl: './dispensing-queue.component.html',
  styleUrls: ['./dispensing-queue.component.scss']
})
export class DispensingQueueComponent implements OnInit, OnDestroy {
  queueItems: DispensingQueue[] = [];
  filteredItems: DispensingQueue[] = [];
  isLoading = false;
  
  filterForm!: FormGroup;
  
  queueStatuses = Object.values(DispensingQueueStatus);
  priorities = Object.values(QueuePriority);
  
  DispensingQueueStatus = DispensingQueueStatus;
  QueuePriority = QueuePriority;

  statistics = {
    waiting: 0,
    inProgress: 0,
    averageWaitTime: 0,
    urgentCount: 0,
    emergencyCount: 0
  };

  private destroy$ = new Subject<void>();
  private autoRefresh$ = interval(30000); // Refresh every 30 seconds

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private pharmacyService: PharmacyService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadQueue();
    this.loadStatistics();
    this.setupAutoRefresh();
    this.setupFilterSubscription();
    this.logAudit(AuditAction.ACCESS, 'Accessed pharmacy dispensing queue');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [DispensingQueueStatus.WAITING],
      priority: [''],
      searchTerm: ['']
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private setupAutoRefresh(): void {
    this.autoRefresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadQueue(true); // Silent refresh
        this.loadStatistics();
      });
  }

  loadQueue(silent: boolean = false): void {
    if (!silent) {
      this.isLoading = true;
    }

    const status = this.filterForm.get('status')?.value || undefined;
    const priority = this.filterForm.get('priority')?.value || undefined;

    this.pharmacyService.getDispensingQueue(status, priority)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.queueItems = this.sortQueueItems(items);
          this.applyFilters();
          if (!silent) {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to load dispensing queue: ' + error.message);
          if (!silent) {
            this.isLoading = false;
          }
        }
      });
  }

  loadStatistics(): void {
    this.pharmacyService.getQueueStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
        },
        error: () => {
          // Silent fail for statistics
        }
      });
  }

  private sortQueueItems(items: DispensingQueue[]): DispensingQueue[] {
    return items.sort((a, b) => {
      // Priority sorting: EMERGENCY > URGENT > NORMAL
      const priorityOrder = {
        [QueuePriority.EMERGENCY]: 3,
        [QueuePriority.URGENT]: 2,
        [QueuePriority.NORMAL]: 1
      };

      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by prescription date (older first)
      return new Date(a.prescriptionDate).getTime() - new Date(b.prescriptionDate).getTime();
    });
  }

  private applyFilters(): void {
    const searchTerm = this.filterForm.get('searchTerm')?.value?.toLowerCase() || '';

    if (!searchTerm) {
      this.filteredItems = [...this.queueItems];
      return;
    }

    this.filteredItems = this.queueItems.filter(item =>
      item.prescriptionNumber.toLowerCase().includes(searchTerm) ||
      item.patientName.toLowerCase().includes(searchTerm) ||
      item.patientRegistrationNumber.toLowerCase().includes(searchTerm) ||
      item.tokenNumber?.toLowerCase().includes(searchTerm) ||
      item.doctorName.toLowerCase().includes(searchTerm)
    );
  }

  startDispensing(item: DispensingQueue): void {
    this.router.navigate(['/pharmacy/dispense', item.prescriptionId]);
    this.logAudit(
      AuditAction.VIEW,
      `Started dispensing for prescription: ${item.prescriptionNumber}, patient: ${item.patientName}`
    );
  }

  putOnHold(item: DispensingQueue, event: Event): void {
    event.stopPropagation();

    this.pharmacyService.updateQueueStatus(item.id, DispensingQueueStatus.ON_HOLD)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Prescription put on hold');
          this.loadQueue();
          this.logAudit(
            AuditAction.UPDATE,
            `Put prescription ${item.prescriptionNumber} on hold`
          );
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to update status: ' + error.message);
        }
      });
  }

  resumeFromHold(item: DispensingQueue, event: Event): void {
    event.stopPropagation();

    this.pharmacyService.updateQueueStatus(item.id, DispensingQueueStatus.WAITING)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Prescription resumed');
          this.loadQueue();
          this.logAudit(
            AuditAction.UPDATE,
            `Resumed prescription ${item.prescriptionNumber} from hold`
          );
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to update status: ' + error.message);
        }
      });
  }

  getPriorityBadgeClass(priority: QueuePriority): string {
    switch (priority) {
      case QueuePriority.EMERGENCY:
        return 'bg-danger';
      case QueuePriority.URGENT:
        return 'bg-warning';
      case QueuePriority.NORMAL:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: DispensingQueueStatus): string {
    switch (status) {
      case DispensingQueueStatus.WAITING:
        return 'bg-primary';
      case DispensingQueueStatus.IN_PROGRESS:
        return 'bg-info';
      case DispensingQueueStatus.COMPLETED:
        return 'bg-success';
      case DispensingQueueStatus.ON_HOLD:
        return 'bg-warning';
      case DispensingQueueStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getWaitTimeColor(waitTime: number): string {
    if (waitTime < 10) return 'text-success';
    if (waitTime < 20) return 'text-warning';
    return 'text-danger';
  }

  refresh(): void {
    this.loadQueue();
    this.loadStatistics();
  }

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PHARMACY,
      'Dispensing',
      '',
      details
    ).subscribe();
  }
}
