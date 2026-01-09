import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/common';
import {
  AdminDashboardData,
  DoctorDashboardData,
  PharmacyDashboardData,
  SystemAlert
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  /**
   * Get Admin Dashboard Data
   */
  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.apiService.get<AdminDashboardData>('/dashboard/admin');
  }

  /**
   * Get Doctor Dashboard Data
   */
  getDoctorDashboard(doctorId: string): Observable<DoctorDashboardData> {
    return this.apiService.get<DoctorDashboardData>(`/dashboard/doctor/${doctorId}`);
  }

  /**
   * Get Pharmacy Dashboard Data
   */
  getPharmacyDashboard(): Observable<PharmacyDashboardData> {
    return this.apiService.get<PharmacyDashboardData>('/dashboard/pharmacy');
  }

  /**
   * Get system alerts
   */
  getSystemAlerts(): Observable<SystemAlert[]> {
    return this.apiService.get<SystemAlert[]>('/dashboard/alerts');
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): Observable<void> {
    return this.apiService.post<void>(`/dashboard/alerts/${alertId}/acknowledge`, {});
  }

  /**
   * Get real-time statistics
   */
  getRealTimeStats(role: string): Observable<any> {
    return this.apiService.get<any>(`/dashboard/realtime/${role}`);
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(role: 'ADMIN' | 'DOCTOR' | 'PHARMACY', userId?: string): Observable<any> {
    const endpoint = role === 'DOCTOR' && userId
      ? `/dashboard/refresh/doctor/${userId}`
      : `/dashboard/refresh/${role.toLowerCase()}`;
    
    return this.apiService.get<any>(endpoint);
  }
}
