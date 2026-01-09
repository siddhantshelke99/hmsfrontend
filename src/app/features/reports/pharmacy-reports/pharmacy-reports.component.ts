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
  PharmacyReport,
  ControlledDrugReport,
  RevenueReport,
  ReportFormat,
  ReportPeriod
} from '../models/report.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-pharmacy-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './pharmacy-reports.component.html',
  styleUrls: ['./pharmacy-reports.component.scss']
})
export class PharmacyReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reportForm: FormGroup;
  currentReport: 'DISPENSING' | 'CONTROLLED_DRUGS' | 'REVENUE' | 'PERFORMANCE' = 'DISPENSING';
  
  pharmacyReport?: PharmacyReport;
  controlledDrugReport?: ControlledDrugReport;
  revenueReport?: RevenueReport;
  
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
      endDate: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.REPORTS,
      undefined,
      'Accessed Pharmacy Reports'
    );

    // Load default report
    this.loadDispensingReport();
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

  switchReport(reportType: 'DISPENSING' | 'CONTROLLED_DRUGS' | 'REVENUE' | 'PERFORMANCE'): void {
    this.currentReport = reportType;
    
    switch (reportType) {
      case 'DISPENSING':
        this.loadDispensingReport();
        break;
      case 'CONTROLLED_DRUGS':
        this.loadControlledDrugReport();
        break;
      case 'REVENUE':
        this.loadRevenueReport();
        break;
      case 'PERFORMANCE':
        this.loadPerformanceReport();
        break;
    }
  }

  loadDispensingReport(): void {
    this.isLoading = true;
    const startDate = new Date(this.reportForm.value.startDate);
    const endDate = new Date(this.reportForm.value.endDate);

    this.reportService.getDispensingReport(startDate, endDate).subscribe({
      next: (report) => {
        this.pharmacyReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dispensing report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load dispensing report'
        );
        this.isLoading = false;
      }
    });
  }

  loadControlledDrugReport(): void {
    this.isLoading = true;
    const startDate = new Date(this.reportForm.value.startDate);
    const endDate = new Date(this.reportForm.value.endDate);

    this.reportService.getControlledDrugReport(startDate, endDate).subscribe({
      next: (report) => {
        this.controlledDrugReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading controlled drug report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load controlled drug report'
        );
        this.isLoading = false;
      }
    });
  }

  loadRevenueReport(): void {
    this.isLoading = true;
    const filter = {
      startDate: new Date(this.reportForm.value.startDate),
      endDate: new Date(this.reportForm.value.endDate)
    };

    this.reportService.getRevenueReport(filter).subscribe({
      next: (report) => {
        this.revenueReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading revenue report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load revenue report'
        );
        this.isLoading = false;
      }
    });
  }

  loadPerformanceReport(): void {
    this.isLoading = true;
    const startDate = new Date(this.reportForm.value.startDate);
    const endDate = new Date(this.reportForm.value.endDate);

    this.reportService.getPharmacistPerformanceReport(startDate, endDate).subscribe({
      next: (report) => {
        this.pharmacyReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading performance report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load performance report'
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
      case 'DISPENSING':
        this.loadDispensingReport();
        break;
      case 'CONTROLLED_DRUGS':
        this.loadControlledDrugReport();
        break;
      case 'REVENUE':
        this.loadRevenueReport();
        break;
      case 'PERFORMANCE':
        this.loadPerformanceReport();
        break;
    }
  }

  getReportTitle(): string {
    const titles: { [key: string]: string } = {
      'DISPENSING': 'Dispensing Report',
      'CONTROLLED_DRUGS': 'Controlled Drug Report',
      'REVENUE': 'Revenue Report',
      'PERFORMANCE': 'Pharmacist Performance'
    };
    return titles[this.currentReport] || 'Report';
  }

  getPaymentStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Paid': 'badge bg-success',
      'Pending': 'badge bg-warning',
      'Cancelled': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getComplianceClass(compliant: boolean): string {
    return compliant ? 'text-success' : 'text-danger';
  }

  getComplianceBadgeClass(compliant: boolean): string {
    return compliant ? 'badge bg-success' : 'badge bg-danger';
  }

  trackByMedicineId(index: number, item: any): string {
    return item.medicineId || index.toString();
  }

  trackByPharmacistId(index: number, item: any): string {
    return item.pharmacistId || index.toString();
  }
}
