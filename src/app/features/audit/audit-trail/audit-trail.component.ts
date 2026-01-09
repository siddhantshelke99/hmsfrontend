import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { AuditService } from '../services/audit.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
import { NotificationService } from '@app/common/services/notification.service';
import { LoaderComponent } from '@app/common/components/loader/loader.component';
import { 
  AuditTrailEntry, 
  AuditFilter, 
  AuditSummary,
  AuditModule,
  AuditActionType,
  AuditSeverity
} from '../models/audit.model';
import { AuditModule as CommonAuditModule, AuditAction } from '@app/common/models/audit-log.model';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './audit-trail.component.html',
  styleUrls: ['./audit-trail.component.scss']
})
export class AuditTrailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  filterForm: FormGroup;
  auditEntries: AuditTrailEntry[] = [];
  summary?: AuditSummary;
  isLoading = false;
  currentPage = 1;
  pageSize = 50;
  totalRecords = 0;
  totalPages = 0;
  viewMode: 'table' | 'timeline' = 'table';

  // Filter Options
  modules = Object.values(AuditModule);
  actions = Object.values(AuditActionType);
  severities = Object.values(AuditSeverity);
  userRoles = ['ADMIN', 'DOCTOR', 'PHARMACY', 'NURSE', 'RECEPTIONIST', 'AUDITOR'];

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      startDate: [this.getDefaultStartDate()],
      endDate: [this.getDefaultEndDate()],
      module: [''],
      action: [''],
      severity: [''],
      userRole: [''],
      userId: [''],
      userName: [''],
      entityType: [''],
      entityId: [''],
      success: [''],
      ipAddress: ['']
    });
  }

  ngOnInit(): void {
    // Log access
    this.auditLogService.logAction(
      AuditAction.ACCESS,
      CommonAuditModule.AUDIT,
      undefined,
      'Accessed Audit Trail'
    );

    // Setup search debounce
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadAuditTrail();
      });

    // Load initial data
    this.loadAuditTrail();
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadAuditTrail(): void {
    this.isLoading = true;

    const filter: AuditFilter = {
      ...this.filterForm.value,
      page: this.currentPage,
      pageSize: this.pageSize,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      success: this.filterForm.value.success === '' ? undefined : this.filterForm.value.success === 'true'
    };

    this.auditService.getAuditTrail(filter).subscribe({
      next: (response) => {
        this.auditEntries = response.entries;
        this.totalRecords = response.total;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading audit trail:', error);
        this.notificationService.error(
          'Error',
          'Failed to load audit trail'
        );
        this.isLoading = false;
      }
    });
  }

  loadSummary(): void {
    const startDate = this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : new Date();

    this.auditService.getAuditSummary(startDate, endDate).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (error) => {
        console.error('Error loading summary:', error);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAuditTrail();
    this.loadSummary();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      searchTerm: '',
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      module: '',
      action: '',
      severity: '',
      userRole: '',
      userId: '',
      userName: '',
      entityType: '',
      entityId: '',
      success: '',
      ipAddress: ''
    });
    this.applyFilters();
  }

  viewDetails(entry: AuditTrailEntry): void {
    const hasChanges = entry.oldValue || entry.newValue;
    
    let detailsHtml = `
      <div style="text-align: left;">
        <p><strong>Timestamp:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
        <p><strong>User:</strong> ${entry.userName} (${entry.userRole})</p>
        <p><strong>Module:</strong> ${entry.module}</p>
        <p><strong>Action:</strong> ${entry.action}</p>
        <p><strong>Description:</strong> ${entry.description}</p>
        ${entry.entityType ? `<p><strong>Entity Type:</strong> ${entry.entityType}</p>` : ''}
        ${entry.entityName ? `<p><strong>Entity Name:</strong> ${entry.entityName}</p>` : ''}
        ${entry.ipAddress ? `<p><strong>IP Address:</strong> ${entry.ipAddress}</p>` : ''}
        ${entry.deviceInfo ? `<p><strong>Device:</strong> ${entry.deviceInfo}</p>` : ''}
        ${!entry.success && entry.errorMessage ? `<p><strong>Error:</strong> ${entry.errorMessage}</p>` : ''}
    `;

    if (hasChanges) {
      detailsHtml += `
        <hr>
        <h6>Changes:</h6>
        ${entry.oldValue ? `<p><strong>Old Value:</strong><br><pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(entry.oldValue, null, 2)}</pre></p>` : ''}
        ${entry.newValue ? `<p><strong>New Value:</strong><br><pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(entry.newValue, null, 2)}</pre></p>` : ''}
      `;
    }

    detailsHtml += `</div>`;

    Swal.fire({
      title: 'Audit Entry Details',
      html: detailsHtml,
      width: '800px',
      confirmButtonText: 'Close'
    });
  }

  viewUserHistory(entry: AuditTrailEntry): void {
    this.filterForm.patchValue({
      userId: entry.userId,
      userName: entry.userName
    });
    this.applyFilters();
  }

  viewEntityHistory(entry: AuditTrailEntry): void {
    if (entry.entityType && entry.entityId) {
      this.filterForm.patchValue({
        entityType: entry.entityType,
        entityId: entry.entityId
      });
      this.applyFilters();
    }
  }

  exportToExcel(): void {
    Swal.fire({
      title: 'Export Audit Trail',
      text: 'Select export format',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Excel',
      denyButtonText: 'PDF',
      cancelButtonText: 'CSV'
    }).then((result) => {
      if (result.isConfirmed || result.isDenied || result.dismiss === Swal.DismissReason.cancel) {
        let format: 'EXCEL' | 'PDF' | 'CSV' = 'EXCEL';
        
        if (result.isConfirmed) format = 'EXCEL';
        else if (result.isDenied) format = 'PDF';
        else if (result.dismiss === Swal.DismissReason.cancel) format = 'CSV';

        this.performExport(format);
      }
    });
  }

  performExport(format: 'EXCEL' | 'PDF' | 'CSV'): void {
    const filter: AuditFilter = {
      ...this.filterForm.value,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined
    };

    this.isLoading = true;

    this.auditService.exportAuditTrail(filter, format).subscribe({
      next: (url) => {
        // Open download URL in new tab
        window.open(url, '_blank');

        this.auditLogService.logAction(
          AuditAction.UPDATE,
          CommonAuditModule.AUDIT,
          undefined,
          `Exported audit trail to ${format}`
        );

        this.notificationService.success(
          'Export Successful',
          `Audit trail exported to ${format}`
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error(
          'Export Failed',
          'Failed to export audit trail'
        );
        this.isLoading = false;
      }
    });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'timeline' : 'table';
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAuditTrail();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAuditTrail();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAuditTrail();
    }
  }

  getSeverityClass(severity: string): string {
    const classes: { [key: string]: string } = {
      'Info': 'text-info',
      'Warning': 'text-warning',
      'Error': 'text-danger',
      'Critical': 'text-danger fw-bold'
    };
    return classes[severity] || 'text-secondary';
  }

  getSeverityBadgeClass(severity: string): string {
    const classes: { [key: string]: string } = {
      'Info': 'bg-info',
      'Warning': 'bg-warning',
      'Error': 'bg-danger',
      'Critical': 'bg-danger'
    };
    return classes[severity] || 'bg-secondary';
  }

  getStatusIcon(success: boolean): string {
    return success ? 'ph-check-circle' : 'ph-x-circle';
  }

  getStatusClass(success: boolean): string {
    return success ? 'text-success' : 'text-danger';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
