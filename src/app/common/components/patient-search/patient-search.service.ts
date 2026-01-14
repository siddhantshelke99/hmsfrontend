import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient, PatientSearchCriteria } from '../../models/patient.model';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientSearchService {
  private selectedPatientSubject = new BehaviorSubject<Patient | null>(null);
  public selectedPatient$: Observable<Patient | null> = this.selectedPatientSubject.asObservable();

  constructor(private apiService: ApiService ,private http: HttpClient) {}

  /**
   * Search patients by query string
   */
searchPatients(query: string) {
  return this.http.get(`${environment.api_url}/api/patients/search`, { params: { query } })
}

  /**
   * Advanced search with multiple criteria
   */
 advancedSearch(criteria: PatientSearchCriteria) {
  return this.http.get(`${environment.api_url}/api/patients/advanced-search`, { 
    params: criteria as any 
  })
}

  /**
   * Get patient by ID
   */
  getPatientById(id: string): Observable<Patient> {
    return this.apiService.get<Patient>(`/patients/${id}`);
  }

  /**
   * Get patient by registration number
   */
  getPatientByRegistrationNumber(regNo: string): Observable<Patient> {
    return this.apiService.get<Patient>(`/patients/registration/${regNo}`);
  }

  /**
   * Set selected patient
   */
  setSelectedPatient(patient: Patient | null): void {
    this.selectedPatientSubject.next(patient);
  }

  /**
   * Get current selected patient
   */
  getSelectedPatient(): Patient | null {
    return this.selectedPatientSubject.value;
  }

  /**
   * Clear selected patient
   */
  clearSelection(): void {
    this.selectedPatientSubject.next(null);
  }

  /**
   * Verify patient exists
   */
  verifyPatient(registrationNumber: string): Observable<boolean> {
    return this.apiService.get<boolean>(`/patients/verify/${registrationNumber}`);
  }

  /**
   * Get patient history
   */
  getPatientHistory(patientId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/patients/${patientId}/history`);
  }

  /**
   * Get patient prescriptions
   */
  getPatientPrescriptions(patientId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/patients/${patientId}/prescriptions`);
  }
}
