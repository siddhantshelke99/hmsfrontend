import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { AuditService } from '../services/audit.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
import { NotificationService } from '@app/common/services/notification.service';
import { LoaderComponent } from '@app/common/components/loader/loader.component';
import { 
  TheftAlert,
  AlertStatus,
  AlertSeverity,
  AlertType,
  Investigation,
  InvestigationStatus
} from '../models/audit.model';
import { AuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-theft-alerts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './theft-alerts.component.html',
  styleUrls: ['./theft-alerts.component.scss']
})
export class TheftAlertsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filterForm: FormGroup;
  alerts: TheftAlert[] = [];
  activeInvestigations: Investigation[] = [];
  isLoading = false;
  dashboardMetrics = {
    newAlerts: 0,
    criticalAlerts: 0,
    openInvestigations: 0,
    resolvedToday: 0
  };

  // Filter Options
  alertTypes = Object.values(AlertType);
  alertStatuses = Object.values(AlertStatus);
  alertSeverities = Object.values(AlertSeverity);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auditService: AuditService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      alertType: [''],
      status: [''],
      severity: [''],
      startDate: [this.getDefaultStartDate()],
      endDate: [this.getDefaultEndDate()],
      medicineId: ['']
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      AuditModule.AUDIT,
      undefined,
      'Accessed Theft Alerts'
    );

    // Setup search debounce
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadAlerts();
      });

    // Load initial data
    this.loadAlerts();
    this.loadActiveInvestigations();
    this.loadDashboardMetrics();

    // Auto-refresh every 2 minutes
    setInterval(() => {
      this.loadAlerts();
      this.loadDashboardMetrics();
    }, 120000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadAlerts(): void {
    this.isLoading = true;

    const filter = {
      status: this.filterForm.value.status || undefined,
      severity: this.filterForm.value.severity || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      medicineId: this.filterForm.value.medicineId || undefined
    };

    this.auditService.getTheftAlerts(filter).subscribe({
      next: (response) => {
        this.alerts = response.alerts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.notificationService.error(
          'Error',
          'Failed to load theft alerts'
        );
        this.isLoading = false;
      }
    });
  }

  loadActiveInvestigations(): void {
    this.auditService.getActiveInvestigations().subscribe({
      next: (investigations) => {
        this.activeInvestigations = investigations;
      },
      error: (error) => {
        console.error('Error loading investigations:', error);
      }
    });
  }

  loadDashboardMetrics(): void {
    this.auditService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.dashboardMetrics = {
          newAlerts: metrics.pendingAlerts,
          criticalAlerts: metrics.criticalAlerts,
          openInvestigations: metrics.openInvestigations,
          resolvedToday: 0 // Calculate from recent activity
        };
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
      }
    });
  }

  viewAlertDetails(alert: TheftAlert): void {
    let investigationHtml = '';
    
    if (alert.investigation) {
      investigationHtml = `
        <hr>
        <h6>Investigation:</h6>
        <p><strong>Status:</strong> ${alert.investigation.status}</p>
        <p><strong>Investigator:</strong> ${alert.investigation.investigator}</p>
        ${alert.investigation.conclusion ? `<p><strong>Conclusion:</strong> ${alert.investigation.conclusion}</p>` : ''}
      `;
    }

    Swal.fire({
      title: `${alert.alertType} Alert`,
      html: `
        <div style="text-align: left;">
          <p><strong>Severity:</strong> <span class="badge bg-${this.getSeverityColor(alert.severity)}">${alert.severity}</span></p>
          <p><strong>Detected:</strong> ${new Date(alert.detectedDate).toLocaleString()}</p>
          <p><strong>Detected By:</strong> ${alert.detectedBy}</p>
          <hr>
          ${alert.medicineName ? `<p><strong>Medicine:</strong> ${alert.medicineName}</p>` : ''}
          <p><strong>Discrepancy:</strong> ${alert.discrepancyType}</p>
          <p><strong>Expected Quantity:</strong> ${alert.expectedQuantity}</p>
          <p><strong>Actual Quantity:</strong> ${alert.actualQuantity}</p>
          <p><strong>Discrepancy:</strong> <span class="text-danger">${alert.discrepancyQuantity}</span></p>
          <p><strong>Estimated Value:</strong> ₹${alert.estimatedValue.toFixed(2)}</p>
          ${alert.location ? `<p><strong>Location:</strong> ${alert.location}</p>` : ''}
          ${alert.department ? `<p><strong>Department:</strong> ${alert.department}</p>` : ''}
          ${alert.lastAccessedBy ? `<p><strong>Last Accessed By:</strong> ${alert.lastAccessedBy}</p>` : ''}
          ${investigationHtml}
        </div>
      `,
      width: '700px',
      confirmButtonText: 'Close'
    });
  }

  acknowledgeAlert(alert: TheftAlert): void {
    Swal.fire({
      title: 'Acknowledge Alert?',
      text: 'This will mark the alert as acknowledged',
      input: 'textarea',
      inputPlaceholder: 'Enter acknowledgment notes (optional)...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Acknowledge',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const userName = 'Current User'; // TODO: Get from auth service
        
        this.auditService.acknowledgeAlert(alert.id, userName, result.value).subscribe({
          next: (updatedAlert) => {
            this.notificationService.success(
              'Alert Acknowledged',
              'Theft alert has been acknowledged'
            );

            this.auditLogService.logAction(
              AuditAction.UPDATE,
              AuditModule.AUDIT,
              alert.id,
              `Acknowledged theft alert: ${alert.alertType}`
            );

            this.loadAlerts();
          },
          error: (error) => {
            console.error('Error acknowledging alert:', error);
            this.notificationService.error(
              'Acknowledgment Failed',
              'Failed to acknowledge alert'
            );
          }
        });
      }
    });
  }

  assignAlert(alert: TheftAlert): void {
    Swal.fire({
      title: 'Assign Alert',
      text: 'Enter the name of the person to assign this alert to',
      input: 'text',
      inputPlaceholder: 'Assignee name...',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter an assignee name';
        }
        return null;
      },
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Assign',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.assignAlert(alert.id, result.value).subscribe({
          next: (updatedAlert) => {
            this.notificationService.success(
              'Alert Assigned',
              `Alert assigned to ${result.value}`
            );

            this.auditLogService.logAction(
              AuditAction.UPDATE,
              AuditModule.AUDIT,
              alert.id,
              `Assigned theft alert to ${result.value}`
            );

            this.loadAlerts();
          },
          error: (error) => {
            console.error('Error assigning alert:', error);
            this.notificationService.error(
              'Assignment Failed',
              'Failed to assign alert'
            );
          }
        });
      }
    });
  }

  escalateAlert(alert: TheftAlert): void {
    Swal.fire({
      title: 'Escalate Alert',
      html: `
        <div class="mb-3">
          <label class="form-label">Escalation Level</label>
          <select id="escalation-level" class="form-select">
            <option value="1">Level 1 - Supervisor</option>
            <option value="2">Level 2 - Manager</option>
            <option value="3">Level 3 - Director</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Escalation Reason</label>
          <textarea id="escalation-reason" class="form-control" rows="3" placeholder="Reason for escalation..."></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Escalate',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const level = (document.getElementById('escalation-level') as HTMLSelectElement).value;
        const reason = (document.getElementById('escalation-reason') as HTMLTextAreaElement).value;
        
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason for escalation');
          return false;
        }
        
        return { level: parseInt(level), reason };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.escalateAlert(alert.id, result.value.level, result.value.reason).subscribe({
          next: (updatedAlert) => {
            this.notificationService.success(
              'Alert Escalated',
              `Alert escalated to Level ${result.value.level}`
            );

            this.auditLogService.logAction(
              AuditAction.UPDATE,
              AuditModule.AUDIT,
              alert.id,
              `Escalated theft alert to Level ${result.value.level}`
            );

            this.loadAlerts();
          },
          error: (error) => {
            console.error('Error escalating alert:', error);
            this.notificationService.error(
              'Escalation Failed',
              'Failed to escalate alert'
            );
          }
        });
      }
    });
  }

  startInvestigation(alert: TheftAlert): void {
    Swal.fire({
      title: 'Start Investigation',
      html: `
        <div class="mb-3">
          <label class="form-label">Investigator Name</label>
          <input type="text" id="investigator" class="form-control" placeholder="Enter investigator name...">
        </div>
        <div class="mb-3">
          <label class="form-label">Initial Findings</label>
          <textarea id="initial-findings" class="form-control" rows="3" placeholder="Initial observations..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Start Investigation',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const investigator = (document.getElementById('investigator') as HTMLInputElement).value;
        const findings = (document.getElementById('initial-findings') as HTMLTextAreaElement).value;
        
        if (!investigator) {
          Swal.showValidationMessage('Please enter investigator name');
          return false;
        }
        
        return { investigator, findings };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.createInvestigation(
          alert.id,
          result.value.investigator,
          result.value.findings
        ).subscribe({
          next: (investigation) => {
            this.notificationService.success(
              'Investigation Started',
              'Investigation has been initiated'
            );

            this.auditLogService.logAction(
              AuditAction.CREATE,
              AuditModule.AUDIT,
              investigation.id,
              `Started investigation for theft alert: ${alert.alertType}`
            );

            this.loadAlerts();
            this.loadActiveInvestigations();
          },
          error: (error) => {
            console.error('Error starting investigation:', error);
            this.notificationService.error(
              'Investigation Failed',
              'Failed to start investigation'
            );
          }
        });
      }
    });
  }

  resolveAlert(alert: TheftAlert): void {
    Swal.fire({
      title: 'Resolve Alert',
      html: `
        <div class="mb-3">
          <label class="form-label">Resolution Type</label>
          <select id="resolution-type" class="form-select">
            <option value="RESOLVED">Resolved</option>
            <option value="THEFT_CONFIRMED">Theft Confirmed</option>
            <option value="ERROR_CORRECTION">Error Correction</option>
            <option value="SYSTEM_ERROR">System Error</option>
            <option value="FALSE_ALARM">False Alarm</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Resolution Description</label>
          <textarea id="resolution-description" class="form-control" rows="3" placeholder="Describe the resolution..."></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Action Taken</label>
          <textarea id="action-taken" class="form-control" rows="2" placeholder="Actions taken to resolve..."></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Preventive Measures</label>
          <textarea id="preventive-measures" class="form-control" rows="2" placeholder="Measures to prevent recurrence..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Resolve',
      cancelButtonText: 'Cancel',
      width: '700px',
      preConfirm: () => {
        const resolutionType = (document.getElementById('resolution-type') as HTMLSelectElement).value;
        const description = (document.getElementById('resolution-description') as HTMLTextAreaElement).value;
        const actionTaken = (document.getElementById('action-taken') as HTMLTextAreaElement).value;
        const preventiveMeasures = (document.getElementById('preventive-measures') as HTMLTextAreaElement).value;
        
        if (!description || !actionTaken) {
          Swal.showValidationMessage('Please fill in all required fields');
          return false;
        }
        
        return {
          id: `RES-${Date.now()}`,
          resolvedDate: new Date(),
          resolvedBy: 'Current User', // TODO: Get from auth service
          resolutionType,
          description,
          actionTaken,
          preventiveMeasures: preventiveMeasures ? [preventiveMeasures] : []
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.resolveAlert(alert.id, result.value).subscribe({
          next: (resolvedAlert) => {
            this.notificationService.success(
              'Alert Resolved',
              'Theft alert has been resolved'
            );

            this.auditLogService.logAction(
              AuditAction.UPDATE,
              AuditModule.AUDIT,
              alert.id,
              `Resolved theft alert: ${result.value.resolutionType}`
            );

            this.loadAlerts();
            this.loadDashboardMetrics();
          },
          error: (error) => {
            console.error('Error resolving alert:', error);
            this.notificationService.error(
              'Resolution Failed',
              'Failed to resolve alert'
            );
          }
        });
      }
    });
  }

  markAsFalseAlarm(alert: TheftAlert): void {
    Swal.fire({
      title: 'Mark as False Alarm?',
      text: 'Please provide a reason for marking this as a false alarm',
      input: 'textarea',
      inputPlaceholder: 'Reason for false alarm...',
      inputValidator: (value) => {
        if (!value) {
          return 'Please provide a reason';
        }
        return null;
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Mark as False Alarm',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auditService.markAsFalseAlarm(alert.id, result.value).subscribe({
          next: (updatedAlert) => {
            this.notificationService.success(
              'Marked as False Alarm',
              'Alert has been marked as false alarm'
            );

            this.auditLogService.logAction(
              AuditAction.UPDATE,
              AuditModule.AUDIT,
              alert.id,
              'Marked theft alert as false alarm'
            );

            this.loadAlerts();
          },
          error: (error) => {
            console.error('Error marking false alarm:', error);
            this.notificationService.error(
              'Update Failed',
              'Failed to mark alert as false alarm'
            );
          }
        });
      }
    });
  }

  applyFilters(): void {
    this.loadAlerts();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      searchTerm: '',
      alertType: '',
      status: '',
      severity: '',
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      medicineId: ''
    });
    this.loadAlerts();
  }

  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      'Low': 'info',
      'Medium': 'warning',
      'High': 'danger',
      'Critical': 'danger'
    };
    return colors[severity] || 'secondary';
  }

  getSeverityBadgeClass(severity: string): string {
    return `bg-${this.getSeverityColor(severity)}`;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'New': 'bg-danger',
      'Acknowledged': 'bg-info',
      'Investigating': 'bg-warning',
      'Resolved': 'bg-success',
      'False Alarm': 'bg-secondary',
      'Escalated': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getInvestigationStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Initiated': 'text-info',
      'In Progress': 'text-warning',
      'Pending Review': 'text-warning',
      'Completed': 'text-success',
      'Closed': 'text-secondary'
    };
    return classes[status] || 'text-secondary';
  }
}
