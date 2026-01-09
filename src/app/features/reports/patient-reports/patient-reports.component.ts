import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ReportService } from '../services/report.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
import { NotificationService } from '@app/common/services/notification.service';
import { LoaderComponent } from '@app/common/components/loader/loader.component';
import { 
  PatientReport,
  PatientLoadReport,
  ReportFormat,
  ReportPeriod
} from '../models/report.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-patient-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './patient-reports.component.html',
  styleUrls: ['./patient-reports.component.scss']
})
export class PatientReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reportForm: FormGroup;
  currentReport: 'PATIENT_STATISTICS' | 'PATIENT_LOAD' | 'DEMOGRAPHICS' = 'PATIENT_STATISTICS';
  
  patientReport?: PatientReport;
  patientLoadReport?: PatientLoadReport;
  
  isLoading = false;
  reportPeriods = Object.values(ReportPeriod);
  reportFormats = Object.values(ReportFormat);
  
  // Expose enum to template
  ReportFormat = ReportFormat;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService
  ) {
    this.reportForm = this.fb.group({
      startDate: [this.getDefaultStartDate()],
      endDate: [new Date().toISOString().split('T')[0]],
      loadDate: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.REPORTS,
      undefined,
      'Accessed Patient Reports'
    );

    // Load default report
    this.loadPatientReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  switchReport(reportType: 'PATIENT_STATISTICS' | 'PATIENT_LOAD' | 'DEMOGRAPHICS'): void {
    this.currentReport = reportType;
    
    switch (reportType) {
      case 'PATIENT_STATISTICS':
        this.loadPatientReport();
        break;
      case 'PATIENT_LOAD':
        this.loadPatientLoadReport();
        break;
      case 'DEMOGRAPHICS':
        this.loadDemographicsReport();
        break;
    }
  }

  loadPatientReport(): void {
    this.isLoading = true;
    const filter = {
      startDate: new Date(this.reportForm.value.startDate),
      endDate: new Date(this.reportForm.value.endDate)
    };

    this.reportService.getPatientReport(filter).subscribe({
      next: (report) => {
        this.patientReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load patient report'
        );
        this.isLoading = false;
      }
    });
  }

  loadPatientLoadReport(): void {
    this.isLoading = true;
    const date = new Date(this.reportForm.value.loadDate);

    this.reportService.getPatientLoadReport(date).subscribe({
      next: (report) => {
        this.patientLoadReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient load report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load patient load report'
        );
        this.isLoading = false;
      }
    });
  }

  loadDemographicsReport(): void {
    this.isLoading = true;

    this.reportService.getDemographicsReport().subscribe({
      next: (report) => {
        this.patientReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading demographics report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load demographics report'
        );
        this.isLoading = false;
      }
    });
  }

  exportReport(format: ReportFormat): void {
    Swal.fire({
      title: 'Export Report?',
      text: `Export ${this.getReportTitle()} to ${format}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Export',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performExport(format);
      }
    });
  }

  performExport(format: ReportFormat): void {
    this.isLoading = true;

    const filter = {
      startDate: new Date(this.reportForm.value.startDate),
      endDate: new Date(this.reportForm.value.endDate)
    };

    this.reportService.exportReport(this.currentReport, format, filter).subscribe({
      next: (url) => {
        window.open(url, '_blank');

        this.auditLogService.logAction(
          AuditAction.UPDATE,
          AuditModule.REPORTS,
          undefined,
          `Exported ${this.currentReport} report to ${format}`
        );

        this.notificationService.success(
          'Export Successful',
          `Report exported to ${format}`
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error(
          'Export Failed',
          'Failed to export report'
        );
        this.isLoading = false;
      }
    });
  }

  printReport(): void {
    window.print();
    
    this.auditLogService.logAction(
      AuditAction.UPDATE,
      AuditModule.REPORTS,
      undefined,
      `Printed ${this.currentReport} report`
    );
  }

  refreshReport(): void {
    switch (this.currentReport) {
      case 'PATIENT_STATISTICS':
        this.loadPatientReport();
        break;
      case 'PATIENT_LOAD':
        this.loadPatientLoadReport();
        break;
      case 'DEMOGRAPHICS':
        this.loadDemographicsReport();
        break;
    }
  }

  getReportTitle(): string {
    const titles: { [key: string]: string } = {
      'PATIENT_STATISTICS': 'Patient Statistics',
      'PATIENT_LOAD': 'Patient Load Report',
      'DEMOGRAPHICS': 'Demographics Report'
    };
    return titles[this.currentReport] || 'Report';
  }

  getLoadClass(utilizationRate: number): string {
    if (utilizationRate >= 90) return 'text-danger';
    if (utilizationRate >= 75) return 'text-warning';
    return 'text-success';
  }

  getLoadBadgeClass(utilizationRate: number): string {
    if (utilizationRate >= 90) return 'badge bg-danger';
    if (utilizationRate >= 75) return 'badge bg-warning';
    return 'badge bg-success';
  }

  getMaxHourlyPatients(): number {
    if (!this.patientLoadReport) return 1;
    return Math.max(...this.patientLoadReport.byHour.map(h => h.patientCount));
  }

  isPeakHour(hour: string): boolean {
    if (!this.patientLoadReport) return false;
    return this.patientLoadReport.peakHours.includes(hour);
  }
}
