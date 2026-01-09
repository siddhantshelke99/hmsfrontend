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
  StockReport,
  ExpiryReport,
  ABCAnalysisReport,
  ReportFormat,
  ReportPeriod,
  StockStatus
} from '../models/report.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-stock-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './stock-reports.component.html',
  styleUrls: ['./stock-reports.component.scss']
})
export class StockReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reportForm: FormGroup;
  currentReport: 'STOCK' | 'EXPIRY' | 'ABC' | 'LOW_STOCK' = 'STOCK';
  
  stockReport?: StockReport;
  expiryReport?: ExpiryReport;
  abcReport?: ABCAnalysisReport;
  
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
      reportDate: [new Date().toISOString().split('T')[0]],
      expiryDays: [90],
      abcPeriod: [ReportPeriod.THIS_YEAR]
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.REPORTS,
      undefined,
      'Accessed Stock Reports'
    );

    // Load default report
    this.loadStockReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchReport(reportType: 'STOCK' | 'EXPIRY' | 'ABC' | 'LOW_STOCK'): void {
    this.currentReport = reportType;
    
    switch (reportType) {
      case 'STOCK':
        this.loadStockReport();
        break;
      case 'EXPIRY':
        this.loadExpiryReport();
        break;
      case 'ABC':
        this.loadABCAnalysis();
        break;
      case 'LOW_STOCK':
        this.loadLowStockReport();
        break;
    }
  }

  loadStockReport(): void {
    this.isLoading = true;
    const date = new Date(this.reportForm.value.reportDate);

    this.reportService.getStockReport(date).subscribe({
      next: (report) => {
        this.stockReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stock report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load stock report'
        );
        this.isLoading = false;
      }
    });
  }

  loadExpiryReport(): void {
    this.isLoading = true;
    const days = this.reportForm.value.expiryDays;

    this.reportService.getExpiryReport(days).subscribe({
      next: (report) => {
        this.expiryReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading expiry report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load expiry report'
        );
        this.isLoading = false;
      }
    });
  }

  loadABCAnalysis(): void {
    this.isLoading = true;
    const period = this.reportForm.value.abcPeriod;

    this.reportService.getABCAnalysis(period).subscribe({
      next: (report) => {
        this.abcReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ABC analysis:', error);
        this.notificationService.error(
          'Error',
          'Failed to load ABC analysis'
        );
        this.isLoading = false;
      }
    });
  }

  loadLowStockReport(): void {
    this.isLoading = true;

    this.reportService.getLowStockReport().subscribe({
      next: (report) => {
        this.stockReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading low stock report:', error);
        this.notificationService.error(
          'Error',
          'Failed to load low stock report'
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
      startDate: new Date(this.reportForm.value.reportDate),
      endDate: new Date(this.reportForm.value.reportDate)
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
      case 'STOCK':
        this.loadStockReport();
        break;
      case 'EXPIRY':
        this.loadExpiryReport();
        break;
      case 'ABC':
        this.loadABCAnalysis();
        break;
      case 'LOW_STOCK':
        this.loadLowStockReport();
        break;
    }
  }

  getReportTitle(): string {
    const titles: { [key: string]: string } = {
      'STOCK': 'Stock Report',
      'EXPIRY': 'Expiry Report',
      'ABC': 'ABC Analysis',
      'LOW_STOCK': 'Low Stock Report'
    };
    return titles[this.currentReport] || 'Report';
  }

  getStockStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Out of Stock': 'text-danger',
      'Low Stock': 'text-warning',
      'Adequate': 'text-success',
      'Overstock': 'text-info'
    };
    return classes[status] || 'text-secondary';
  }

  getExpiryStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Expired': 'text-danger fw-bold',
      'Expiring Soon': 'text-danger',
      'Expiring': 'text-warning',
      'Good': 'text-success'
    };
    return classes[status] || 'text-secondary';
  }

  getABCCategoryClass(category: string): string {
    const classes: { [key: string]: string } = {
      'A': 'badge bg-danger',
      'B': 'badge bg-warning',
      'C': 'badge bg-info'
    };
    return classes[category] || 'badge bg-secondary';
  }

  getLowStockItems(): any[] {
    if (!this.stockReport) return [];
    return this.stockReport.medicines.filter(item => 
      item.stockStatus === StockStatus.LOW_STOCK || 
      item.stockStatus === StockStatus.OUT_OF_STOCK
    );
  }

  trackByMedicineId(index: number, item: any): string {
    return item.medicineId || index.toString();
  }
}
