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
  PrescriptionReport,
  MedicineConsumptionReport,
  ReportFormat,
  ReportPeriod
} from '../models/report.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-prescription-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './prescription-reports.component.html',
  styleUrls: ['./prescription-reports.component.scss']
})
export class PrescriptionReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reportForm: FormGroup;
  currentReport: 'PRESCRIPTIONS' | 'DOCTOR_WISE' | 'CONSUMPTION' = 'PRESCRIPTIONS';
  
  prescriptionReport?: PrescriptionReport;
  consumptionReport?: MedicineConsumptionReport;
  
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
      department: [''],
      doctorId: ['']
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.REPORTS,
      undefined,
      'Accessed Prescription Reports'
    );

    // Load default report
    this.loadPrescriptionReport();
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

  switchReport(reportType: 'PRESCRIPTIONS' | 'DOCTOR_WISE' | 'CONSUMPTION'): void {
    this.currentReport = reportType;
    
    switch (reportType) {
      case 'PRESCRIPTIONS':
        this.loadPrescriptionReport();
        break;
      case 'DOCTOR_WISE':
        this.loadDoctorWiseReport();
        break;
      case 'CONSUMPTION':
        this.loadConsumptionReport();
        break;
    }
  }

  loadPrescriptionReport(): void {
    this.isLoading = true;
    const filter = {
      startDate: new Date(this.reportForm.value.startDate),
      endDate: new Date(this.reportForm.value.endDate),
      department: this.reportForm.value.department || undefined
    };

    this.reportService.getPrescriptionReport(filter).subscribe({
      next: (report) => {
        this.prescriptionReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prescription report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load prescription report'
        );
        this.isLoading = false;
      }
    });
  }

  loadDoctorWiseReport(): void {
    this.isLoading = true;
    const startDate = new Date(this.reportForm.value.startDate);
    const endDate = new Date(this.reportForm.value.endDate);
    const doctorId = this.reportForm.value.doctorId || undefined;

    this.reportService.getDoctorWiseReport(startDate, endDate, doctorId).subscribe({
      next: (report) => {
        this.prescriptionReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading doctor-wise report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load doctor-wise report'
        );
        this.isLoading = false;
      }
    });
  }

  loadConsumptionReport(): void {
    this.isLoading = true;
    const filter = {
      startDate: new Date(this.reportForm.value.startDate),
      endDate: new Date(this.reportForm.value.endDate),
      department: this.reportForm.value.department || undefined
    };

    this.reportService.getMedicineConsumptionReport(filter).subscribe({
      next: (report) => {
        this.consumptionReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading consumption report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load consumption report'
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
      endDate: new Date(this.reportForm.value.endDate),
      department: this.reportForm.value.department || undefined
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
      case 'PRESCRIPTIONS':
        this.loadPrescriptionReport();
        break;
      case 'DOCTOR_WISE':
        this.loadDoctorWiseReport();
        break;
      case 'CONSUMPTION':
        this.loadConsumptionReport();
        break;
    }
  }

  getReportTitle(): string {
    const titles: { [key: string]: string } = {
      'PRESCRIPTIONS': 'Prescription Report',
      'DOCTOR_WISE': 'Doctor-wise Report',
      'CONSUMPTION': 'Medicine Consumption Report'
    };
    return titles[this.currentReport] || 'Report';
  }

  getTrendClass(trend: string): string {
    const classes: { [key: string]: string } = {
      'INCREASING': 'text-success',
      'STABLE': 'text-info',
      'DECREASING': 'text-warning'
    };
    return classes[trend] || 'text-secondary';
  }

  getTrendIcon(trend: string): string {
    const icons: { [key: string]: string } = {
      'INCREASING': 'bi-arrow-up',
      'STABLE': 'bi-arrow-right',
      'DECREASING': 'bi-arrow-down'
    };
    return icons[trend] || 'bi-dash';
  }

  getDispensingStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Dispensed': 'badge bg-success',
      'Partially Dispensed': 'badge bg-warning',
      'Pending': 'badge bg-info',
      'Cancelled': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  trackByDoctorId(index: number, item: any): string {
    return item.doctorId || index.toString();
  }

  trackByMedicine(index: number, item: any): string {
    return item.medicine || index.toString();
  }

  trackByMedicineId(index: number, item: any): string {
    return item.medicineId || index.toString();
  }

  trackByPrescriptionId(index: number, item: any): string {
    return item.prescriptionId || index.toString();
  }

  getTotalMedicineCount(): number {
    if (!this.prescriptionReport) return 0;
    return this.prescriptionReport.prescriptions.reduce((sum, p) => sum + p.medicineCount, 0);
  }
}
