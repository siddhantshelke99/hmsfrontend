import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/common/services/api.service';
import { 
  StockReport,
  ExpiryReport,
  ABCAnalysisReport,
  PrescriptionReport,
  MedicineConsumptionReport,
  PatientReport,
  PatientLoadReport,
  PharmacyReport,
  ControlledDrugReport,
  RevenueReport,
  OutsourcedMedicineReport,
  FinancialReport,
  ReportFilter,
  ReportMetadata,
  ReportFormat,
  ReportPeriod
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly API_BASE = '/reports';

  constructor(private apiService: ApiService) {}

  // Stock Reports
  
  getStockReport(date?: Date): Observable<StockReport> {
    return this.apiService.post(`${this.API_BASE}/stock/current`, { date: date || new Date() });
  }

  getExpiryReport(days: number = 90): Observable<ExpiryReport> {
    return this.apiService.get(`${this.API_BASE}/stock/expiry?days=${days}`);
  }

  getABCAnalysis(period: ReportPeriod = ReportPeriod.THIS_YEAR): Observable<ABCAnalysisReport> {
    return this.apiService.post(`${this.API_BASE}/stock/abc-analysis`, { period });
  }

  getLowStockReport(): Observable<StockReport> {
    return this.apiService.get(`${this.API_BASE}/stock/low-stock`);
  }

  getStockValuationReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/stock/valuation`, { startDate, endDate });
  }

  // Prescription Reports
  
  getPrescriptionReport(filter: ReportFilter): Observable<PrescriptionReport> {
    return this.apiService.post(`${this.API_BASE}/prescriptions/summary`, filter);
  }

  getDoctorWiseReport(startDate: Date, endDate: Date, doctorId?: string): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/prescriptions/doctor-wise`, { 
      startDate, 
      endDate, 
      doctorId 
    });
  }

  getMedicineConsumptionReport(filter: ReportFilter): Observable<MedicineConsumptionReport> {
    return this.apiService.post(`${this.API_BASE}/prescriptions/consumption`, filter);
  }

  getPrescriptionTrends(period: ReportPeriod, groupBy: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/prescriptions/trends`, { period, groupBy });
  }

  // Patient Reports
  
  getPatientReport(filter: ReportFilter): Observable<PatientReport> {
    return this.apiService.post(`${this.API_BASE}/patients/summary`, filter);
  }

  getPatientLoadReport(date: Date): Observable<PatientLoadReport> {
    return this.apiService.post(`${this.API_BASE}/patients/load`, { date });
  }

  getDemographicsReport(): Observable<any> {
    return this.apiService.get(`${this.API_BASE}/patients/demographics`);
  }

  getDepartmentWisePatients(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/patients/department-wise`, { startDate, endDate });
  }

  getPatientVisitHistory(patientId: string): Observable<any> {
    return this.apiService.get(`${this.API_BASE}/patients/${patientId}/history`);
  }

  // Pharmacy Reports
  
  getPharmacyReport(filter: ReportFilter): Observable<PharmacyReport> {
    return this.apiService.post(`${this.API_BASE}/pharmacy/summary`, filter);
  }

  getDispensingReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/pharmacy/dispensing`, { startDate, endDate });
  }

  getControlledDrugReport(startDate: Date, endDate: Date): Observable<ControlledDrugReport> {
    return this.apiService.post(`${this.API_BASE}/pharmacy/controlled-drugs`, { startDate, endDate });
  }

  getPharmacistPerformanceReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/pharmacy/pharmacist-performance`, { 
      startDate, 
      endDate 
    });
  }

  getRevenueReport(filter: ReportFilter): Observable<RevenueReport> {
    return this.apiService.post(`${this.API_BASE}/pharmacy/revenue`, filter);
  }

  // Outsourced Medicine Reports
  
  getOutsourcedMedicineReport(filter: ReportFilter): Observable<OutsourcedMedicineReport> {
    return this.apiService.post(`${this.API_BASE}/outsourced/summary`, filter);
  }

  getVendorPerformanceReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/outsourced/vendor-performance`, { 
      startDate, 
      endDate 
    });
  }

  // Financial Reports
  
  getFinancialReport(startDate: Date, endDate: Date): Observable<FinancialReport> {
    return this.apiService.post(`${this.API_BASE}/financial/summary`, { startDate, endDate });
  }

  getInventoryTurnoverReport(period: ReportPeriod): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/financial/inventory-turnover`, { period });
  }

  getProfitabilityReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/financial/profitability`, { startDate, endDate });
  }

  getCostAnalysisReport(startDate: Date, endDate: Date): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/financial/cost-analysis`, { startDate, endDate });
  }

  // Export Functions
  
  exportReport(
    reportType: string, 
    format: ReportFormat, 
    filter: ReportFilter
  ): Observable<string> {
    // Returns download URL
    return this.apiService.post(`${this.API_BASE}/export/${reportType}/${format}`, filter);
  }

  scheduleReport(
    reportType: string,
    schedule: string, // cron expression
    recipients: string[],
    format: ReportFormat
  ): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/schedule`, {
      reportType,
      schedule,
      recipients,
      format
    });
  }

  // Dashboard & Analytics
  
  getDashboardMetrics(): Observable<{
    todayPatients: number;
    todayPrescriptions: number;
    todayDispensing: number;
    todayRevenue: number;
    lowStockCount: number;
    expiringCount: number;
    pendingDispensing: number;
    criticalAlerts: number;
  }> {
    return this.apiService.get(`${this.API_BASE}/dashboard/metrics`);
  }

  getExecutiveSummary(period: ReportPeriod): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/executive-summary`, { period });
  }

  // Saved Reports
  
  getSavedReports(userId?: string): Observable<ReportMetadata[]> {
    return this.apiService.get(`${this.API_BASE}/saved${userId ? '?userId=' + userId : ''}`);
  }

  saveReport(reportData: any, reportName: string): Observable<ReportMetadata> {
    return this.apiService.post(`${this.API_BASE}/save`, { reportData, reportName });
  }

  deleteReport(reportId: string): Observable<any> {
    return this.apiService.delete(`${this.API_BASE}/saved/${reportId}`);
  }

  // Comparative Reports
  
  getComparativeReport(
    reportType: string,
    period1: { startDate: Date; endDate: Date },
    period2: { startDate: Date; endDate: Date }
  ): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/comparative/${reportType}`, {
      period1,
      period2
    });
  }

  // Trending Analysis
  
  getTrendingMedicines(days: number = 30): Observable<any> {
    return this.apiService.get(`${this.API_BASE}/trends/medicines?days=${days}`);
  }

  getTrendingDiagnoses(days: number = 30): Observable<any> {
    return this.apiService.get(`${this.API_BASE}/trends/diagnoses?days=${days}`);
  }

  // Custom Reports
  
  generateCustomReport(query: any): Observable<any> {
    return this.apiService.post(`${this.API_BASE}/custom/generate`, query);
  }

  // Helper Methods
  
  getReportPeriodDates(period: ReportPeriod): { startDate: Date; endDate: Date } {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case ReportPeriod.TODAY:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.YESTERDAY:
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(today.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.THIS_WEEK:
        const dayOfWeek = today.getDay();
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.LAST_WEEK:
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        startDate.setTime(lastWeekStart.getTime());
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.THIS_MONTH:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.LAST_MONTH:
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth());
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.THIS_YEAR:
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportPeriod.LAST_YEAR:
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setFullYear(today.getFullYear() - 1);
        endDate.setMonth(11);
        endDate.setDate(31);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  formatReportData(data: any, format: ReportFormat): any {
    // Format data based on export format
    // This can be expanded based on specific formatting needs
    return data;
  }
}
