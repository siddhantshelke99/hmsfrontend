import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/common';
import { Patient } from '@app/common/models/patient.model';

export interface PatientRegistrationData extends Patient {
  photoFile?: File;
  aadharFile?: File;
}

export interface TokenInfo {
  id?: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  tokenDate: Date;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checkInTime: Date;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  queuePosition: number;
  estimatedWaitTime?: number;
  remarks?: string;
  createdBy: string;
  createdAt: Date;
}

export interface PatientVisit {
  id: string;
  patientId: string;
  visitDate: Date;
  visitType: 'OPD' | 'IPD' | 'EMERGENCY';
  doctorId: string;
  doctorName: string;
  department: string;
  chiefComplaint: string;
  diagnosis?: string;
  prescriptionId?: string;
  labReports?: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  followUpDate?: Date;
  remarks?: string;
}

export interface PatientHistory {
  patient: Patient;
  visits: PatientVisit[];
  prescriptions: any[]; // Will link to Prescription module
  labReports: any[];
  admissions: any[];
  surgeries: any[];
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  vitalSigns: VitalSign[];
}

export interface VitalSign {
  id?: string;
  patientId: string;
  visitId?: string;
  recordDate: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedBy: string;
}

export interface PatientSearchCriteria {
  query?: string;
  patientId?: string;
  name?: string;
  mobileNumber?: string;
  aadharNumber?: string;
  dateOfBirth?: Date;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  registeredFrom?: Date;
  registeredTo?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private apiService: ApiService) {}

  // ============================================
  // PATIENT REGISTRATION
  // ============================================

  /**
   * Register new patient
   */
  registerPatient(patient: PatientRegistrationData): Observable<Patient> {
    const formData = new FormData();
    
    // Append patient data
    Object.keys(patient).forEach(key => {
      if (key !== 'photoFile' && key !== 'aadharFile') {
        formData.append(key, (patient as any)[key]);
      }
    });

    // Append files if present
    if (patient.photoFile) {
      formData.append('photo', patient.photoFile);
    }
    if (patient.aadharFile) {
      formData.append('aadharProof', patient.aadharFile);
    }

    return this.apiService.post<Patient>('/patients/register', formData);
  }

  /**
   * Update patient details
   */
  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.apiService.put<Patient>(`/patients/${id}`, patient);
  }

  /**
   * Get patient by ID
   */
  getPatientById(id: string): Observable<Patient> {
    return this.apiService.get<Patient>(`/patients/${id}`);
  }

  /**
   * Search patients
   */
  searchPatients(criteria: PatientSearchCriteria): Observable<Patient[]> {
    return this.apiService.post<Patient[]>('/patients/search', criteria);
  }

  /**
   * Get all patients (with pagination)
   */
  getAllPatients(page: number = 1, limit: number = 50): Observable<{ patients: Patient[], total: number }> {
    return this.apiService.get<{ patients: Patient[], total: number }>('/patients', { page, limit });
  }

  /**
   * Verify Aadhar number (placeholder for actual API)
   */
  verifyAadhar(aadharNumber: string): Observable<{ valid: boolean, name?: string, dob?: string }> {
    return this.apiService.post<{ valid: boolean, name?: string, dob?: string }>('/patients/verify-aadhar', { aadharNumber });
  }

  /**
   * Check duplicate patient
   */
  checkDuplicate(mobileNumber: string, aadharNumber: string): Observable<{ exists: boolean, patient?: Patient }> {
    return this.apiService.post<{ exists: boolean, patient?: Patient }>('/patients/check-duplicate', { mobileNumber, aadharNumber });
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Generate OPD token
   */
  generateToken(tokenData: Partial<TokenInfo>): Observable<TokenInfo> {
    return this.apiService.post<TokenInfo>('/patients/tokens', tokenData);
  }

  /**
   * Get today's tokens
   */
  getTodaysTokens(doctorId?: string, department?: string): Observable<TokenInfo[]> {
    return this.apiService.get<TokenInfo[]>('/patients/tokens/today', { doctorId, department });
  }

  /**
   * Get token by ID
   */
  getTokenById(id: string): Observable<TokenInfo> {
    return this.apiService.get<TokenInfo>(`/patients/tokens/${id}`);
  }

  /**
   * Update token status
   */
  updateTokenStatus(id: string, status: string): Observable<TokenInfo> {
    return this.apiService.put<TokenInfo>(`/patients/tokens/${id}/status`, { status });
  }

  /**
   * Get patient's tokens
   */
  getPatientTokens(patientId: string): Observable<TokenInfo[]> {
    return this.apiService.get<TokenInfo[]>(`/patients/${patientId}/tokens`);
  }

  /**
   * Get queue position
   */
  getQueuePosition(tokenId: string): Observable<{ position: number, estimatedWaitTime: number }> {
    return this.apiService.get<{ position: number, estimatedWaitTime: number }>(`/patients/tokens/${tokenId}/queue-position`);
  }

  // ============================================
  // PATIENT HISTORY
  // ============================================

  /**
   * Get complete patient history
   */
  getPatientHistory(patientId: string): Observable<PatientHistory> {
    return this.apiService.get<PatientHistory>(`/patients/${patientId}/history`);
  }

  /**
   * Get patient visits
   */
  getPatientVisits(patientId: string): Observable<PatientVisit[]> {
    return this.apiService.get<PatientVisit[]>(`/patients/${patientId}/visits`);
  }

  /**
   * Create patient visit
   */
  createVisit(visit: Partial<PatientVisit>): Observable<PatientVisit> {
    return this.apiService.post<PatientVisit>('/patients/visits', visit);
  }

  /**
   * Record vital signs
   */
  recordVitals(vitals: VitalSign): Observable<VitalSign> {
    return this.apiService.post<VitalSign>('/patients/vitals', vitals);
  }

  /**
   * Get patient vital signs history
   */
  getVitalSigns(patientId: string): Observable<VitalSign[]> {
    return this.apiService.get<VitalSign[]>(`/patients/${patientId}/vitals`);
  }

  /**
   * Update patient allergies
   */
  updateAllergies(patientId: string, allergies: string[]): Observable<Patient> {
    return this.apiService.put<Patient>(`/patients/${patientId}/allergies`, { allergies });
  }

  /**
   * Update chronic conditions
   */
  updateChronicConditions(patientId: string, conditions: string[]): Observable<Patient> {
    return this.apiService.put<Patient>(`/patients/${patientId}/chronic-conditions`, { conditions });
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get patient statistics
   */
  getPatientStats(): Observable<any> {
    return this.apiService.get<any>('/patients/statistics');
  }

  /**
   * Get today's registrations count
   */
  getTodaysRegistrations(): Observable<number> {
    return this.apiService.get<number>('/patients/today/count');
  }
}
