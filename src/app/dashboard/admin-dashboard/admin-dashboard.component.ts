import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { DashboardService } from '../services/dashboard.service';
import { AdminDashboardData, DashboardMetric, SystemAlert } from '../models/dashboard.model';
import { LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  dashboardData: AdminDashboardData | null = null;
  metrics: DashboardMetric[] = [];
  isLoading: boolean = true;
  lastUpdated: Date = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private auditLog: AuditLogService
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
    this.dashboardService.getAdminDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.buildMetrics(data);
          this.isLoading = false;
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.isLoading = false;
        }
      });
  }

  buildMetrics(data: AdminDashboardData): void {
    this.metrics = [
      {
        label: 'Total Patients',
        value: data.totalPatients,
        icon: 'bi-people-fill',
        color: 'primary',
        trend: {
          value: data.todayRegistrations,
          isPositive: true
        },
        link: '/patients'
      },
      {
        label: 'Today Registrations',
        value: data.todayRegistrations,
        icon: 'bi-person-plus-fill',
        color: 'success'
      },
      {
        label: 'Total Medicines',
        value: data.totalMedicines,
        icon: 'bi-capsule-pill',
        color: 'info',
        link: '/inventory/stock'
      },
      {
        label: 'Low Stock',
        value: data.lowStockCount,
        icon: 'bi-exclamation-triangle-fill',
        color: 'warning',
        link: '/inventory/stock?filter=low'
      },
      {
        label: 'Expiring Soon',
        value: data.expiringMedicinesCount,
        icon: 'bi-clock-fill',
        color: 'warning',
        link: '/inventory/stock?filter=expiring'
      },
      {
        label: 'Expired',
        value: data.expiredMedicinesCount,
        icon: 'bi-x-circle-fill',
        color: 'danger',
        link: '/inventory/stock?filter=expired'
      },
      {
        label: 'Today Prescriptions',
        value: data.todayPrescriptions,
        icon: 'bi-file-medical-fill',
        color: 'primary',
        link: '/prescriptions'
      },
      {
        label: 'Today Dispensed',
        value: data.todayDispensed,
        icon: 'bi-check-circle-fill',
        color: 'success',
        link: '/pharmacy/dispensed'
      },
      {
        label: 'Pending Dispensing',
        value: data.pendingDispensing,
        icon: 'bi-hourglass-split',
        color: 'warning',
        link: '/pharmacy/pending'
      },
      {
        label: 'Stock Value',
        value: `₹${this.formatCurrency(data.stockValueTotal)}`,
        icon: 'bi-currency-rupee',
        color: 'info'
      }
    ];
  }

  setupAutoRefresh(): void {
    // Refresh every 5 minutes
    interval(300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  refreshDashboard(): void {
    this.dashboardService.refreshDashboard('ADMIN')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.buildMetrics(data);
          this.lastUpdated = new Date();
        },
        error: (error) => {
          console.error('Error refreshing dashboard:', error);
        }
      });
  }

  acknowledgeAlert(alert: SystemAlert): void {
    this.dashboardService.acknowledgeAlert(alert.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.dashboardData) {
            const index = this.dashboardData.systemAlerts.findIndex(a => a.id === alert.id);
            if (index !== -1) {
              this.dashboardData.systemAlerts[index].acknowledged = true;
            }
          }
          
          // Log the acknowledgment
          this.auditLog.logAction(
            AuditAction.UPDATE,
            AuditModule.INVENTORY,
            'SystemAlert',
            alert.id,
            `Acknowledged alert: ${alert.message}`
          ).subscribe();
        }
      });
  }

  getAlertClass(type: string): string {
    switch (type) {
      case 'CRITICAL': return 'alert-danger';
      case 'WARNING': return 'alert-warning';
      default: return 'alert-info';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'CRITICAL': return 'bi-x-circle-fill';
      case 'WARNING': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  logAccess(): void {
    this.auditLog.logAction(
      AuditAction.VIEW,
      AuditModule.REPORTS,
      'Dashboard',
      'admin',
      'Accessed admin dashboard'
    ).subscribe();
  }
}
