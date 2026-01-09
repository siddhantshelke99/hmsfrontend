import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { DashboardService } from '../services/dashboard.service';
import { PharmacyDashboardData, DispenseQueue, StockAlert, ExpiringMedicine } from '../models/dashboard.model';
import { LoaderComponent, ConfirmDialogComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.scss']
})
export class PharmacyDashboardComponent implements OnInit, OnDestroy {
  dashboardData: PharmacyDashboardData | null = null;
  isLoading: boolean = true;
  lastUpdated: Date = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private auditLog: AuditLogService,
    private confirmDialog: ConfirmDialogComponent
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.setupAutoRefresh();
    this.logAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.dashboardService.getPharmacyDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.isLoading = false;
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.isLoading = false;
        }
      });
  }

  setupAutoRefresh(): void {
    // Refresh every 3 minutes for queue and stock updates
    interval(180000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  refreshDashboard(): void {
    this.dashboardService.refreshDashboard('PHARMACY')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error refreshing dashboard:', error);
        }
      });
  }

  async startDispensing(item: DispenseQueue): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      'Start Dispensing',
      `Start dispensing medicines for prescription ${item.prescriptionNumber}?`,
      'Yes, Start',
      'Cancel',
      'question'
    );

    if (confirmed) {
      // TODO: Navigate to dispense page
      console.log('Start dispensing:', item);
      
      this.auditLog.logAction(
        AuditAction.DISPENSE,
        AuditModule.PHARMACY,
        'Prescription',
        item.prescriptionId,
        `Started dispensing for ${item.patientName}`
      ).subscribe();
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'IN_PROGRESS': return 'bg-info';
      case 'PARTIAL': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadge(priority: string): string {
    return priority === 'URGENT' ? 'bg-danger' : 'bg-secondary';
  }

  getDaysRemainingColor(days: number): string {
    if (days <= 30) return 'text-danger';
    if (days <= 60) return 'text-warning';
    return 'text-info';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  logAccess(): void {
    this.auditLog.logAction(
      AuditAction.VIEW,
      AuditModule.REPORTS,
      'Dashboard',
      'pharmacy',
      'Accessed pharmacy dashboard'
    ).subscribe();
  }
}
