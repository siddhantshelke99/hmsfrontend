import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuditLog, AuditAction, AuditModule, AuditLogFilter } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = '/api/audit-logs'; // Configure with environment

  constructor(private http: HttpClient) {}

  /**
   * Create an audit log entry
   * Call this method after every critical operation
   */
  logAction(
    action: AuditAction,
    module: AuditModule,
    entityType: string,
    entityId: string,
    details?: string,
    oldValue?: any,
    newValue?: any
  ): Observable<AuditLog> {
    const auditLog: AuditLog = {
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      userRole: this.getCurrentUserRole(),
      action,
      module,
      entityType,
      entityId,
      details,
      oldValue,
      newValue,
      severity: this.determineSeverity(action),
      ipAddress: this.getClientIP()
    };

    return this.http.post<AuditLog>(this.apiUrl, auditLog).pipe(
      tap(() => console.log(`[AUDIT] ${action} on ${entityType}:${entityId}`))
    );
  }

  /**
   * Retrieve audit logs with filters
   */
  getAuditLogs(filter?: AuditLogFilter): Observable<AuditLog[]> {
    let params = new HttpParams();
    
    if (filter?.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter?.userId) {
      params = params.set('userId', filter.userId);
    }
    if (filter?.action) {
      params = params.set('action', filter.action);
    }
    if (filter?.module) {
      params = params.set('module', filter.module);
    }
    if (filter?.severity) {
      params = params.set('severity', filter.severity);
    }

    return this.http.get<AuditLog[]>(this.apiUrl, { params });
  }

  /**
   * Get audit trail for a specific entity
   */
  getEntityAuditTrail(entityType: string, entityId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`);
  }

  /**
   * Helper methods - implement based on your auth service
   */
  private getCurrentUserId(): string {
    // TODO: Get from AuthService
    return localStorage.getItem('userId') || 'SYSTEM';
  }

  private getCurrentUserName(): string {
    // TODO: Get from AuthService
    return localStorage.getItem('userName') || 'System User';
  }

  private getCurrentUserRole(): 'ADMIN' | 'DOCTOR' | 'PHARMACY' {
    // TODO: Get from AuthService
    return (localStorage.getItem('userRole') as any) || 'ADMIN';
  }

  private getClientIP(): string {
    // TODO: Implement IP detection or get from backend
    return 'N/A';
  }

  private determineSeverity(action: AuditAction): 'INFO' | 'WARNING' | 'CRITICAL' {
    const criticalActions = [AuditAction.DELETE, AuditAction.ADJUST];
    const warningActions = [AuditAction.REJECT, AuditAction.RETURN];
    
    if (criticalActions.includes(action)) return 'CRITICAL';
    if (warningActions.includes(action)) return 'WARNING';
    return 'INFO';
  }
}
