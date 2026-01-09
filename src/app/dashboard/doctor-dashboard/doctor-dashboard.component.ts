import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { DashboardService } from '../services/dashboard.service';
import { DoctorDashboardData, PatientQueue } from '../models/dashboard.model';
import { LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  dashboardData: DoctorDashboardData | null = null;
  isLoading: boolean = true;
  lastUpdated: Date = new Date();
  currentDoctorId: string = 'DOC-001'; // TODO: Get from AuthService

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
    this.dashboardService.getDoctorDashboard(this.currentDoctorId)
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
    // Refresh every 2 minutes for queue updates
    interval(120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  refreshDashboard(): void {
    this.dashboardService.refreshDashboard('DOCTOR', this.currentDoctorId)
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

  startConsultation(patient: PatientQueue): void {
    // TODO: Navigate to consultation page
    console.log('Start consultation for:', patient);
    
    this.auditLog.logAction(
      AuditAction.VIEW,
      AuditModule.PATIENT,
      'Consultation',
      patient.tokenNumber,
      `Started consultation for ${patient.patientName}`
    ).subscribe();
  }

  getWaitingTimeColor(minutes: number): string {
    if (minutes > 60) return 'text-danger';
    if (minutes > 30) return 'text-warning';
    return 'text-success';
  }

  getPriorityBadge(priority: string): string {
    return priority === 'URGENT' ? 'bg-danger' : 'bg-secondary';
  }

  logAccess(): void {
    this.auditLog.logAction(
      AuditAction.VIEW,
      AuditModule.REPORTS,
      'Dashboard',
      'doctor',
      'Accessed doctor dashboard'
    ).subscribe();
  }
}
