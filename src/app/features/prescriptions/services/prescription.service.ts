import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '@app/common';
import {
  Prescription,
  PrescriptionItem,
  PrescriptionFilter,
  PrescriptionSummary,
  PrescriptionStatus,
  DispensingStatus,
  MedicineFormulary,
  DoctorSignature
} from '../models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private readonly API_URL = '/api/prescriptions';

  constructor(private apiService: ApiService) {}

  /**
   * Create a new prescription
   */
  createPrescription(prescription: Prescription): Observable<Prescription> {
    return this.apiService.post<Prescription>(this.API_URL, prescription);
  }

  /**
   * Get prescription by ID
   */
  getPrescriptionById(id: string): Observable<Prescription> {
    return this.apiService.get<Prescription>(`${this.API_URL}/${id}`);
  }

  /**
   * Get prescription by prescription number
   */
  getPrescriptionByNumber(prescriptionNumber: string): Observable<Prescription> {
    return this.apiService.get<Prescription>(`${this.API_URL}/number/${prescriptionNumber}`);
  }

  /**
   * Get all prescriptions for a patient
   */
  getPrescriptionsByPatient(patientId: string): Observable<Prescription[]> {
    return this.apiService.get<Prescription[]>(`${this.API_URL}/patient/${patientId}`);
  }

  /**
   * Get all prescriptions by doctor
   */
  getPrescriptionsByDoctor(doctorId: string, params?: any): Observable<PrescriptionSummary[]> {
    return this.apiService.get<PrescriptionSummary[]>(`${this.API_URL}/doctor/${doctorId}`, params);
  }

  /**
   * Get filtered prescription list
   */
  getPrescriptionList(filter: PrescriptionFilter, page: number = 1, pageSize: number = 20): Observable<{
    prescriptions: PrescriptionSummary[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = {
      ...filter,
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    return this.apiService.get<any>(`${this.API_URL}/list`, params);
  }

  /**
   * Search prescriptions
   */
  searchPrescriptions(searchTerm: string): Observable<PrescriptionSummary[]> {
    return this.apiService.get<PrescriptionSummary[]>(`${this.API_URL}/search`, { searchTerm });
  }

  /**
   * Update prescription
   */
  updatePrescription(id: string, prescription: Partial<Prescription>): Observable<Prescription> {
    return this.apiService.put<Prescription>(`${this.API_URL}/${id}`, prescription);
  }

  /**
   * Cancel prescription
   */
  cancelPrescription(id: string, reason: string): Observable<Prescription> {
    return this.apiService.put<Prescription>(`${this.API_URL}/${id}/cancel`, { reason });
  }

  /**
   * Update prescription status
   */
  updatePrescriptionStatus(id: string, status: PrescriptionStatus): Observable<Prescription> {
    return this.apiService.put<Prescription>(`${this.API_URL}/${id}/status`, { status });
  }

  /**
   * Update dispensing status
   */
  updateDispensingStatus(id: string, dispensingStatus: DispensingStatus, dispensedBy?: string): Observable<Prescription> {
    return this.apiService.put<Prescription>(`${this.API_URL}/${id}/dispensing-status`, {
      dispensingStatus,
      dispensedBy,
      dispensedDate: new Date()
    });
  }

  /**
   * Search medicine formulary with stock availability
   */
  searchFormulary(searchTerm: string, checkStock: boolean = true): Observable<MedicineFormulary[]> {
    return this.apiService.get<MedicineFormulary[]>('/api/formulary/search', {
      searchTerm,
      checkStock: checkStock.toString()
    });
  }

  /**
   * Get medicine formulary by ID with current stock
   */
  getFormularyMedicine(medicineId: string): Observable<MedicineFormulary> {
    return this.apiService.get<MedicineFormulary>(`/api/formulary/${medicineId}`);
  }

  /**
   * Get common medicines for a department
   */
  getCommonMedicines(department: string): Observable<MedicineFormulary[]> {
    return this.apiService.get<MedicineFormulary[]>('/api/formulary/common', { department });
  }

  /**
   * Get scheduled/controlled medicines
   */
  getScheduledMedicines(): Observable<MedicineFormulary[]> {
    return this.apiService.get<MedicineFormulary[]>('/api/formulary/scheduled');
  }

  /**
   * Validate medicine availability before prescription
   */
  validateMedicineAvailability(medicineId: string, quantity: number): Observable<{
    available: boolean;
    currentStock: number;
    reorderLevel: number;
    alternativeMedicines?: MedicineFormulary[];
  }> {
    return this.apiService.post<any>('/api/formulary/validate', { medicineId, quantity });
  }

  /**
   * Add digital signature to prescription
   */
  addDigitalSignature(prescriptionId: string, signature: DoctorSignature): Observable<Prescription> {
    return this.apiService.post<Prescription>(`${this.API_URL}/${prescriptionId}/sign`, signature);
  }

  /**
   * Generate prescription PDF (opens in new tab)
   */
  generatePrescriptionPDF(prescriptionId: string): void {
    window.open(`${this.API_URL}/${prescriptionId}/pdf`, '_blank');
  }

  /**
   * Print prescription
   */
  printPrescription(prescriptionId: string): void {
    window.open(`${this.API_URL}/${prescriptionId}/print`, '_blank');
  }

  /**
   * Get prescription statistics
   */
  getPrescriptionStats(startDate: Date, endDate: Date, doctorId?: string): Observable<{
    totalPrescriptions: number;
    totalPatients: number;
    totalMedicines: number;
    averageMedicinesPerPrescription: number;
    topMedicines: Array<{ medicine: string; count: number }>;
    prescriptionsByStatus: Array<{ status: string; count: number }>;
    prescriptionsByDepartment: Array<{ department: string; count: number }>;
  }> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (doctorId) {
      params.doctorId = doctorId;
    }
    return this.apiService.get<any>(`${this.API_URL}/statistics`, params);
  }

  /**
   * Get pending prescriptions for dispensing
   */
  getPendingPrescriptions(): Observable<PrescriptionSummary[]> {
    return this.apiService.get<PrescriptionSummary[]>(`${this.API_URL}/pending-dispensing`);
  }

  /**
   * Calculate total quantity based on dosage and duration
   */
  calculateTotalQuantity(
    dosageMorning: number,
    dosageAfternoon: number,
    dosageEvening: number,
    dosageNight: number,
    duration: number,
    durationUnit: string
  ): number {
    const dailyDose = (dosageMorning || 0) + (dosageAfternoon || 0) + (dosageEvening || 0) + (dosageNight || 0);
    
    let totalDays = duration;
    if (durationUnit === 'Weeks') {
      totalDays = duration * 7;
    } else if (durationUnit === 'Months') {
      totalDays = duration * 30;
    }

    return Math.ceil(dailyDose * totalDays);
  }

  /**
   * Generate prescription number
   */
  generatePrescriptionNumber(): Observable<string> {
    return this.apiService.get<string>(`${this.API_URL}/generate-number`);
  }
}
