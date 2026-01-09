import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { AuditService } from '../services/audit.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
import { NotificationService } from '@app/common/services/notification.service';
import { LoaderComponent } from '@app/common/components/loader/loader.component';
import { 
  ComplianceReport,
  ComplianceReportType,
  ReportStatus,
  DrugControlCompliance
} from '../models/audit.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-compliance-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './compliance-reports.component.html',
  styleUrls: ['./compliance-reports.component.scss']
})
export class ComplianceReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  generateForm: FormGroup;
  filterForm: FormGroup;
  reports: ComplianceReport[] = [];
  drugControlCompliance?: DrugControlCompliance;
  isLoading = false;
  isGenerating = false;
  showGenerateForm = false;

  // Filter Options
  reportTypes = Object.values(ComplianceReportType);
  reportStatuses = Object.values(ReportStatus);

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService
  ) {
    this.generateForm = this.fb.group({
      reportType: ['', Validators.required],
      startDate: [this.getDefaultStartDate(), Validators.required],
      endDate: [this.getDefaultEndDate(), Validators.required],
      department: ['']
    });

    this.filterForm = this.fb.group({
      reportType: [''],
      status: [''],
      startDate: [this.getDefaultStartDate()],
      endDate: [this.getDefaultEndDate()]
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.AUDIT,
      undefined,
      'Accessed Compliance Reports'
    );

    // Load initial data
    this.loadReports();
    this.loadDrugControlCompliance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Last month
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadReports(): void {
    this.isLoading = true;

    const filter = {
      reportType: this.filterForm.value.reportType || undefined,
      status: this.filterForm.value.status || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined
    };

    this.auditService.getComplianceReports(filter).subscribe({
      next: (response) => {
        this.reports = response.reports;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.notificationService.error(
          'Error',
          'Failed to load compliance reports'
        );
        this.isLoading = false;
      }
    });
  }

  loadDrugControlCompliance(): void {
    this.auditService.getDrugControlCompliance().subscribe({
      next: (compliance) => {
        this.drugControlCompliance = compliance;
      },
      error: (error) => {
        console.error('Error loading drug control compliance:', error);
      }
    });
  }

  toggleGenerateForm(): void {
    this.showGenerateForm = !this.showGenerateForm;
    if (this.showGenerateForm) {
      this.generateForm.reset({
        reportType: '',
        startDate: this.getDefaultStartDate(),
        endDate: this.getDefaultEndDate(),
        department: ''
      });
    }
  }

  generateReport(): void {
    if (this.generateForm.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        icon: 'error'
      });
      return;
    }

    Swal.fire({
      title: 'Generate Compliance Report?',
      text: `This will generate a ${this.generateForm.value.reportType} report`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Generate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performGeneration();
      }
    });
  }

  performGeneration(): void {
    this.isGenerating = true;

    const { reportType, startDate, endDate, department } = this.generateForm.value;

    this.auditService.generateComplianceReport(
      reportType,
      new Date(startDate),
      new Date(endDate),
      { department: department || undefined }
    ).subscribe({
      next: (report) => {
        this.notificationService.success(
          'Report Generated',
          `${reportType} report generated successfully`
        );

        this.auditLogService.logAction(
          AuditAction.CREATE,
          AuditModule.AUDIT,
          report.id,
          `Generated compliance report: ${reportType}`
        );

        this.isGenerating = false;
        this.showGenerateForm = false;
        this.loadReports();
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.notificationService.error(
          'Generation Failed',
          'Failed to generate compliance report'
        );
        this.isGenerating = false;
      }
    });
  }

  viewReport(report: ComplianceReport): void {
    let findingsHtml = '';
    
    if (report.findings && report.findings.length > 0) {
      findingsHtml = '<div class="mt-3"><h6>Key Findings:</h6><ul class="text-start">';
      report.findings.slice(0, 5).forEach(finding => {
        findingsHtml += `<li><strong>${finding.title}</strong> - ${finding.severity}</li>`;
      });
      if (report.findings.length > 5) {
        findingsHtml += `<li><em>... and ${report.findings.length - 5} more findings</em></li>`;
      }
      findingsHtml += '</ul></div>';
    }

    Swal.fire({
      title: report.reportType,
      html: `
        <div style="text-align: left;">
          <p><strong>Generated:</strong> ${new Date(report.generatedDate).toLocaleString()}</p>
          <p><strong>By:</strong> ${report.generatedBy}</p>
          <p><strong>Period:</strong> ${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="badge bg-${this.getStatusColor(report.status)}">${report.status}</span></p>
          <hr>
          <h6>Summary:</h6>
          <p><strong>Compliance Score:</strong> ${report.summary.complianceScore}%</p>
          <p><strong>Total Checks:</strong> ${report.summary.totalChecks}</p>
          <p><strong>Passed:</strong> ${report.summary.passedChecks} | <strong>Failed:</strong> ${report.summary.failedChecks}</p>
          <p><strong>Critical Issues:</strong> ${report.summary.criticalIssues}</p>
          ${findingsHtml}
        </div>
      `,
      width: '700px',
      confirmButtonText: 'Close'
    });
  }

  approveReport(report: ComplianceReport): void {
    Swal.fire({
      title: 'Approve Report?',
      text: 'Do you want to approve this compliance report?',
      input: 'textarea',
      inputPlaceholder: 'Approver comments (optional)...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.approveComplianceReport(report.id, result.value).subscribe({
          next: (updatedReport) => {
            this.notificationService.success(
              'Report Approved',
              'Compliance report approved successfully'
            );

            this.auditLogService.logAction(
              AuditAction.APPROVE,
              AuditModule.AUDIT,
              report.id,
              `Approved compliance report: ${report.reportType}`
            );

            this.loadReports();
          },
          error: (error) => {
            console.error('Error approving report:', error);
            this.notificationService.error(
              'Approval Failed',
              'Failed to approve compliance report'
            );
          }
        });
      }
    });
  }

  rejectReport(report: ComplianceReport): void {
    Swal.fire({
      title: 'Reject Report?',
      text: 'Please provide a reason for rejection',
      input: 'textarea',
      inputPlaceholder: 'Rejection reason...',
      inputValidator: (value) => {
        if (!value) {
          return 'Please provide a reason for rejection';
        }
        return null;
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.rejectComplianceReport(report.id, result.value).subscribe({
          next: (updatedReport) => {
            this.notificationService.success(
              'Report Rejected',
              'Compliance report rejected'
            );

            this.auditLogService.logAction(
              AuditAction.REJECT,
              AuditModule.AUDIT,
              report.id,
              `Rejected compliance report: ${report.reportType}`
            );

            this.loadReports();
          },
          error: (error) => {
            console.error('Error rejecting report:', error);
            this.notificationService.error(
              'Rejection Failed',
              'Failed to reject compliance report'
            );
          }
        });
      }
    });
  }

  downloadReport(report: ComplianceReport, format: 'PDF' | 'EXCEL'): void {
    this.isLoading = true;

    this.auditService.downloadComplianceReport(report.id, format).subscribe({
      next: (url) => {
        window.open(url, '_blank');

        this.auditLogService.logAction(
          AuditAction.UPDATE,
          AuditModule.AUDIT,
          report.id,
          `Downloaded compliance report as ${format}`
        );

        this.notificationService.success(
          'Download Started',
          `Report download started`
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Download error:', error);
        this.notificationService.error(
          'Download Failed',
          'Failed to download report'
        );
        this.isLoading = false;
      }
    });
  }

  runDrugAudit(): void {
    Swal.fire({
      title: 'Run Drug Control Audit?',
      text: 'This will perform a comprehensive audit of all controlled drugs',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Run Audit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        this.auditService.runDrugControlAudit().subscribe({
          next: (compliance) => {
            this.drugControlCompliance = compliance;
            
            this.notificationService.success(
              'Audit Complete',
              `Drug control audit completed. ${compliance.discrepanciesFound} discrepancies found.`
            );

            this.auditLogService.logAction(
              AuditAction.CREATE,
              AuditModule.AUDIT,
              undefined,
              'Ran drug control audit'
            );

            this.isLoading = false;
          },
          error: (error) => {
            console.error('Audit error:', error);
            this.notificationService.error(
              'Audit Failed',
              'Failed to run drug control audit'
            );
            this.isLoading = false;
          }
        });
      }
    });
  }

  verifyNDPS(): void {
    this.isLoading = true;

    this.auditService.verifyNDPSCompliance().subscribe({
      next: (result) => {
        const icon = result.compliant ? 'success' : 'warning';
        const title = result.compliant ? 'NDPS Compliant' : 'NDPS Issues Found';
        
        let html = `<div style="text-align: left;">`;
        
        if (result.issues.length > 0) {
          html += `<h6>Issues:</h6><ul>`;
          result.issues.forEach(issue => {
            html += `<li>${issue}</li>`;
          });
          html += `</ul>`;
        }

        if (result.recommendations.length > 0) {
          html += `<h6>Recommendations:</h6><ul>`;
          result.recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
          });
          html += `</ul>`;
        }

        html += `</div>`;

        Swal.fire({
          title: title,
          html: html,
          icon: icon,
          width: '600px'
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('NDPS verification error:', error);
        this.notificationService.error(
          'Verification Failed',
          'Failed to verify NDPS compliance'
        );
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadReports();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      reportType: '',
      status: '',
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    });
    this.loadReports();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Draft': 'secondary',
      'Pending Review': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
      'Archived': 'secondary'
    };
    return colors[status] || 'secondary';
  }

  getStatusBadgeClass(status: string): string {
    return `bg-${this.getStatusColor(status)}`;
  }

  getComplianceScoreClass(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-danger';
  }
}
