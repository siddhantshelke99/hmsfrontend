import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient } from '@app/common/models/patient.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  constructor(private http: HttpClient) { }

  // ============================================
  // PATIENT REGISTRATION
  // ============================================

  /**
   * Register new patient
   */
  registerPatient(data: any): Observable<any> {
    return this.http.post(`${environment.api_url}/api/patients/register`, data);
  }

  /**
   * Get patient by ID
   */
  getPatientById(patientId: string): Observable<{ data: Patient }> {
    return this.http.get<{ data: Patient }>(
      `${environment.api_url}/api/patients/getPatientById/${patientId}`
    );
  }

  /**
   * Update patient details
   */
  updatePatient(id: string, patient: Partial<Patient>): Observable<any> {
    return this.http.post(`${environment.api_url}/api/patients/update/${id}`, patient);
  }

  /**
   * Search patients
   */
  searchPatients(criteria: any) {
    return this.http.get(`${environment.api_url}/api/patients/search`, { params: criteria });
  }

  /**
   * Get all patients (with pagination)
   */
  getAllPatients(page: number = 1, limit: number = 50): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get(`${environment.api_url}/api/patients/getAll`, { params });
  }

  /**
   * Verify Aadhar number (placeholder for actual API)
   */
  verifyAadhar(aadharNumber: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(
      `${environment.api_url}/api/patients/verifyAadhar`,
      { aadharNumber }
    );
  }

  /**
   * Check duplicate patient
   */
  checkDuplicate(mobileNumber: string, aadharNumber: string): Observable<{ exists: boolean; patient?: Patient }> {
    return this.http.post<{ exists: boolean; patient?: Patient }>(
      `${environment.api_url}/api/patients/checkDuplicate`,
      { mobileNumber, aadharNumber }
    );
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Generate OPD token
   */
  generateToken(tokenData: any): Observable<any> {
    return this.http.post(`${environment.api_url}/api/patients/tokens/generate`, tokenData);
  }

  /**
   * Get today's tokens
   */
  getTodaysTokens(): Observable<any> {
    return this.http.get(`${environment.api_url}/api/patients/tokens/getTodaysTokens`);
  }

  // ============================================
  // PATIENT HISTORY
  // ============================================

  /**
   * Get complete patient history
   */
  // patient.service.ts

  getPatientHistory(patientId: string) {
    return this.http.get(`${environment.api_url}/api/patients/history/${patientId}`);
  }
  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get patient statistics
   */
  getPatientStats(): Observable<any> {
    return this.http.get(`${environment.api_url}/api/patients/statistics/get`);
  }
}
