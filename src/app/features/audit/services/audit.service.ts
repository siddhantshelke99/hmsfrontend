import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '@app/common/services/api.service';
import { 
  AuditTrailEntry, 
  AuditFilter, 
  AuditSummary,
  ComplianceReport,
  ComplianceReportType,
  DrugControlCompliance,
  TheftAlert,
  DiscrepancyReport,
  AuditConfiguration,
  AlertStatus,
  Investigation,
  AlertResolution
} from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly API_BASE = '/audit';

  constructor(private apiService: ApiService) {}

  // Audit Trail Methods
  getAuditTrail(filter: AuditFilter): Observable<{ entries: AuditTrailEntry[]; total: number; page: number; pageSize: number }> {
    return this.apiService.post(`${this.API_BASE}/trail/search`, filter);
  }

  getAuditEntry(id: string): Observable<AuditTrailEntry> {
    return this.apiService.get(`${this.API_BASE}/trail/${id}`);
  }

  getAuditSummary(startDate: Date, endDate: Date): Observable<AuditSummary> {
    return this.apiService.post(`${this.API_BASE}/summary`, { startDate, endDate });
  }

  getUserAuditHistory(userId: string, startDate?: Date, endDate?: Date): Observable<AuditTrailEntry[]> {
    return this.apiService.post(`${this.API_BASE}/user/${userId}`, { startDate, endDate });
  }

  getEntityAuditHistory(entityType: string, entityId: string): Observable<AuditTrailEntry[]> {
    return this.apiService.get(`${this.API_BASE}/entity/${entityType}/${entityId}`);
  }

  exportAuditTrail(filter: AuditFilter, format: 'CSV' | 'PDF' | 'EXCEL'): Observable<string> {
    // Returns download URL
    return this.apiService.post(`${this.API_BASE}/export/${format}`, filter);
  }

  // Compliance Report Methods
  getComplianceReports(filter?: { 
    reportType?: ComplianceReportType; 
    startDate?: Date; 
    endDate?: Date;
    status?: string;
  }): Observable<{ reports: ComplianceReport[]; total: number }> {
    return this.apiService.post(`${this.API_BASE}/compliance/list`, filter || {});
  }

  getComplianceReport(id: string): Observable<ComplianceReport> {
    return this.apiService.get(`${this.API_BASE}/compliance/${id}`);
  }

  generateComplianceReport(reportType: ComplianceReportType, startDate: Date, endDate: Date, options?: any): Observable<ComplianceReport> {
    return this.apiService.post(`${this.API_BASE}/compliance/generate`, {
      reportType,
      startDate,
      endDate,
      ...options
    });
  }

  approveComplianceReport(id: string, approverComments?: string): Observable<ComplianceReport> {
    return this.apiService.post(`${this.API_BASE}/compliance/${id}/approve`, { approverComments });
  }

  rejectComplianceReport(id: string, reason: string): Observable<ComplianceReport> {
    return this.apiService.post(`${this.API_BASE}/compliance/${id}/reject`, { reason });
  }

  downloadComplianceReport(id: string, format: 'PDF' | 'EXCEL'): Observable<string> {
    // Returns download URL
    return this.apiService.get(`${this.API_BASE}/compliance/${id}/download/${format}`);
  }

  // Drug Control Compliance Methods
  getDrugControlCompliance(date?: Date): Observable<DrugControlCompliance> {
    return this.apiService.post(`${this.API_BASE}/drug-control/check`, { date: date || new Date() });
  }

  runDrugControlAudit(): Observable<DrugControlCompliance> {
    return this.apiService.post(`${this.API_BASE}/drug-control/audit`, {});
  }

  getControlledDrugHistory(medicineId: string, days: number = 30): Observable<any[]> {
    return this.apiService.get(`${this.API_BASE}/drug-control/medicine/${medicineId}/history?days=${days}`);
  }

  verifyNDPSCompliance(): Observable<{ compliant: boolean; issues: string[]; recommendations: string[] }> {
    return this.apiService.get(`${this.API_BASE}/drug-control/ndps/verify`);
  }

  // Theft Alert Methods
  getTheftAlerts(filter?: {
    status?: AlertStatus;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    medicineId?: string;
  }): Observable<{ alerts: TheftAlert[]; total: number }> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/list`, filter || {});
  }

  getTheftAlert(id: string): Observable<TheftAlert> {
    return this.apiService.get(`${this.API_BASE}/theft-alerts/${id}`);
  }

  acknowledgeAlert(id: string, acknowledgedBy: string, notes?: string): Observable<TheftAlert> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/${id}/acknowledge`, { acknowledgedBy, notes });
  }

  assignAlert(id: string, assignedTo: string): Observable<TheftAlert> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/${id}/assign`, { assignedTo });
  }

  escalateAlert(id: string, escalationLevel: number, reason: string): Observable<TheftAlert> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/${id}/escalate`, { escalationLevel, reason });
  }

  resolveAlert(id: string, resolution: AlertResolution): Observable<TheftAlert> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/${id}/resolve`, resolution);
  }

  markAsFalseAlarm(id: string, reason: string): Observable<TheftAlert> {
    return this.apiService.post(`${this.API_BASE}/theft-alerts/${id}/false-alarm`, { reason });
  }

  // Investigation Methods
  createInvestigation(alertId: string, investigator: string, initialFindings?: string): Observable<Investigation> {
    return this.apiService.post(`${this.API_BASE}/investigations/create`, { alertId, investigator, initialFindings });
  }

  getInvestigation(id: string): Observable<Investigation> {
    return this.apiService.get(`${this.API_BASE}/investigations/${id}`);
  }

  updateInvestigation(id: string, updates: Partial<Investigation>): Observable<Investigation> {
    return this.apiService.put(`${this.API_BASE}/investigations/${id}`, updates);
  }

  addInvestigationFinding(id: string, finding: string): Observable<Investigation> {
    return this.apiService.post(`${this.API_BASE}/investigations/${id}/findings`, { finding });
  }

  completeInvestigation(id: string, conclusion: string, recommendedAction: string): Observable<Investigation> {
    return this.apiService.post(`${this.API_BASE}/investigations/${id}/complete`, { conclusion, recommendedAction });
  }

  uploadInvestigationEvidence(id: string, file: File, description: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    return this.apiService.post(`${this.API_BASE}/investigations/${id}/evidence`, formData);
  }

  // Discrepancy Report Methods
  getDiscrepancyReport(reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ADHOC', date?: Date): Observable<DiscrepancyReport> {
    return this.apiService.post(`${this.API_BASE}/discrepancy/report`, { reportType, date: date || new Date() });
  }

  generateDiscrepancyReport(startDate: Date, endDate: Date): Observable<DiscrepancyReport> {
    return this.apiService.post(`${this.API_BASE}/discrepancy/generate`, { startDate, endDate });
  }

  getDiscrepancyTrends(days: number = 30): Observable<any[]> {
    return this.apiService.get(`${this.API_BASE}/discrepancy/trends?days=${days}`);
  }

  // Configuration Methods
  getAuditConfiguration(): Observable<AuditConfiguration> {
    return this.apiService.get(`${this.API_BASE}/configuration`);
  }

  updateAuditConfiguration(config: Partial<AuditConfiguration>): Observable<AuditConfiguration> {
    return this.apiService.put(`${this.API_BASE}/configuration`, config);
  }

  // Statistics Methods
  getAuditStatistics(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/statistics`, { startDate, endDate });
  }

  getDashboardMetrics(): Observable<{
    pendingAlerts: number;
    criticalAlerts: number;
    openInvestigations: number;
    complianceScore: number;
    recentActivity: AuditTrailEntry[];
    alertTrends: any[];
  }> {
    return this.apiService.get(`${this.API_BASE}/dashboard/metrics`);
  }

  // Real-time Monitoring
  getRecentAlerts(minutes: number = 30): Observable<TheftAlert[]> {
    return this.apiService.get(`${this.API_BASE}/theft-alerts/recent?minutes=${minutes}`);
  }

  getActiveInvestigations(): Observable<Investigation[]> {
    return this.apiService.get(`${this.API_BASE}/investigations/active`);
  }

  // Notification Methods
  sendAlertNotification(alertId: string, recipients: string[], message: string): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/notifications/alert`, { alertId, recipients, message });
  }

  scheduleComplianceReport(reportType: ComplianceReportType, schedule: string, recipients: string[]): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/compliance/schedule`, { reportType, schedule, recipients });
  }
}
