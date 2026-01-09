export interface Patient {
  id?: string;
  patientId?: string; // Alias for registrationNumber
  registrationNumber: string;
  name?: string; // Computed full name
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  age?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'Male' | 'Female' | 'Other';
  contactNumber: string;
  mobileNumber?: string; // Alias for contactNumber
  alternateNumber?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadharNumber?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  chronicConditions?: string[]; // Alias for chronicDiseases
  currentMedications?: string[];
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  photoUrl?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface PatientToken {
  id?: string;
  patientId: string;
  patient?: Patient;
  tokenNumber: string;
  tokenDate: Date;
  department: string;
  doctorId: string;
  doctorName: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt?: Date;
}

export interface PatientSearchCriteria {
  registrationNumber?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  aadharNumber?: string;
}
