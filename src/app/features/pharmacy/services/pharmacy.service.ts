import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/common';
import {
  DispensingQueue,
  DispensingItem,
  MedicineDispense,
  ReturnMedicine,
  DispensingHistory,
  DispensingFilter,
  DispensingStatistics,
  BatchSelection,
  DispensingQueueStatus,
  QueuePriority
} from '../models/pharmacy.model';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private readonly API_URL = '/api/pharmacy';

  constructor(private apiService: ApiService) {}

  /**
   * Get dispensing queue (pending prescriptions)
   */
  getDispensingQueue(status?: DispensingQueueStatus, priority?: QueuePriority): Observable<DispensingQueue[]> {
    const params: any = {};
    if (status) params.status = status;
    if (priority) params.priority = priority;
    
    return this.apiService.get<DispensingQueue[]>(`${this.API_URL}/queue`, params);
  }

  /**
   * Get queue item by prescription ID
   */
  getQueueItemByPrescription(prescriptionId: string): Observable<DispensingQueue> {
    return this.apiService.get<DispensingQueue>(`${this.API_URL}/queue/prescription/${prescriptionId}`);
  }

  /**
   * Assign prescription to pharmacist
   */
  assignPrescription(queueId: string, pharmacistId: string): Observable<DispensingQueue> {
    return this.apiService.post<DispensingQueue>(`${this.API_URL}/queue/${queueId}/assign`, { pharmacistId });
  }

  /**
   * Update queue status
   */
  updateQueueStatus(queueId: string, status: DispensingQueueStatus, notes?: string): Observable<DispensingQueue> {
    return this.apiService.put<DispensingQueue>(`${this.API_URL}/queue/${queueId}/status`, { status, notes });
  }

  /**
   * Get available batches for a medicine
   */
  getAvailableBatches(medicineId: string, requiredQuantity: number): Observable<BatchSelection[]> {
    return this.apiService.get<BatchSelection[]>(`${this.API_URL}/batches/${medicineId}`, {
      requiredQuantity: requiredQuantity.toString()
    });
  }

  /**
   * Validate stock availability for dispensing
   */
  validateStockAvailability(items: Array<{ medicineId: string; quantity: number }>): Observable<{
    available: boolean;
    unavailableItems: Array<{ medicineId: string; medicineName: string; requiredQuantity: number; availableQuantity: number }>;
  }> {
    return this.apiService.post<any>(`${this.API_URL}/validate-stock`, { items });
  }

  /**
   * Get substitute medicines
   */
  getSubstituteMedicines(medicineId: string): Observable<Array<{
    id: string;
    name: string;
    genericName: string;
    strength: string;
    availableStock: number;
    unitPrice: number;
  }>> {
    return this.apiService.get<any>(`${this.API_URL}/substitutes/${medicineId}`);
  }

  /**
   * Dispense medicines (full or partial)
   */
  dispenseMedicine(dispense: MedicineDispense): Observable<MedicineDispense> {
    return this.apiService.post<MedicineDispense>(`${this.API_URL}/dispense`, dispense);
  }

  /**
   * Partial dispense - dispense available medicines, mark others as pending
   */
  partialDispense(prescriptionId: string, items: DispensingItem[]): Observable<MedicineDispense> {
    return this.apiService.post<MedicineDispense>(`${this.API_URL}/dispense/partial`, {
      prescriptionId,
      items
    });
  }

  /**
   * Complete partial dispensing (dispense remaining items)
   */
  completePartialDispensing(dispensingId: string, items: DispensingItem[]): Observable<MedicineDispense> {
    return this.apiService.post<MedicineDispense>(`${this.API_URL}/dispense/${dispensingId}/complete`, { items });
  }

  /**
   * Return medicines
   */
  returnMedicine(returnData: ReturnMedicine): Observable<ReturnMedicine> {
    return this.apiService.post<ReturnMedicine>(`${this.API_URL}/return`, returnData);
  }

  /**
   * Get return by ID
   */
  getReturnById(returnId: string): Observable<ReturnMedicine> {
    return this.apiService.get<ReturnMedicine>(`${this.API_URL}/return/${returnId}`);
  }

  /**
   * Approve return
   */
  approveReturn(returnId: string, approvedBy: string): Observable<ReturnMedicine> {
    return this.apiService.post<ReturnMedicine>(`${this.API_URL}/return/${returnId}/approve`, { approvedBy });
  }

  /**
   * Reject return
   */
  rejectReturn(returnId: string, reason: string): Observable<ReturnMedicine> {
    return this.apiService.post<ReturnMedicine>(`${this.API_URL}/return/${returnId}/reject`, { reason });
  }

  /**
   * Get dispensing history with filters
   */
  getDispensingHistory(filter: DispensingFilter, page: number = 1, pageSize: number = 20): Observable<{
    history: DispensingHistory[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params: any = {
      ...filter,
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    return this.apiService.get<any>(`${this.API_URL}/history`, params);
  }

  /**
   * Get dispensing details by ID
   */
  getDispensingById(dispensingId: string): Observable<MedicineDispense> {
    return this.apiService.get<MedicineDispense>(`${this.API_URL}/dispense/${dispensingId}`);
  }

  /**
   * Get patient's dispensing history
   */
  getPatientDispensingHistory(patientId: string): Observable<DispensingHistory[]> {
    return this.apiService.get<DispensingHistory[]>(`${this.API_URL}/history/patient/${patientId}`);
  }

  /**
   * Print dispensing label
   */
  printDispensingLabel(dispensingId: string): void {
    window.open(`${this.API_URL}/dispense/${dispensingId}/print`, '_blank');
  }

  /**
   * Generate dispensing report
   */
  generateDispensingReport(startDate: Date, endDate: Date, format: 'pdf' | 'excel' = 'pdf'): void {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      format
    });
    window.open(`${this.API_URL}/report?${params.toString()}`, '_blank');
  }

  /**
   * Get dispensing statistics
   */
  getDispensingStatistics(startDate: Date, endDate: Date, pharmacistId?: string): Observable<DispensingStatistics> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (pharmacistId) {
      params.pharmacistId = pharmacistId;
    }
    return this.apiService.get<DispensingStatistics>(`${this.API_URL}/statistics`, params);
  }

  /**
   * Get pending partial dispensing items
   */
  getPendingPartialDispensing(): Observable<Array<{
    dispensingId: string;
    prescriptionNumber: string;
    patientName: string;
    pendingItems: number;
    dispensingDate: Date;
  }>> {
    return this.apiService.get<any>(`${this.API_URL}/pending-partial`);
  }

  /**
   * Calculate total amount for dispensing
   */
  calculateTotalAmount(items: DispensingItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.dispensedQuantity * (item.unitPrice || 0));
    }, 0);
  }

  /**
   * Verify if medicine is controlled/scheduled
   */
  isControlledMedicine(medicineId: string): Observable<{
    isControlled: boolean;
    scheduleType?: string;
    requiresAdditionalVerification: boolean;
  }> {
    return this.apiService.get<any>(`${this.API_URL}/controlled/${medicineId}`);
  }

  /**
   * Record controlled medicine dispensing (additional logging)
   */
  recordControlledDispensing(dispensingId: string, additionalDetails: {
    patientIdProof?: string;
    witnessName?: string;
    witnessSignature?: string;
  }): Observable<void> {
    return this.apiService.post<void>(`${this.API_URL}/controlled-log/${dispensingId}`, additionalDetails);
  }

  /**
   * Get queue statistics (for dashboard)
   */
  getQueueStatistics(): Observable<{
    waiting: number;
    inProgress: number;
    averageWaitTime: number;
    urgentCount: number;
    emergencyCount: number;
  }> {
    return this.apiService.get<any>(`${this.API_URL}/queue/statistics`);
  }
}
