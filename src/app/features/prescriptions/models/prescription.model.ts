export interface Prescription {
  id?: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientRegistrationNumber: string;
  doctorId: string;
  doctorName: string;
  doctorQualification?: string;
  doctorRegistrationNumber?: string;
  department: string;
  visitDate: Date;
  diagnosis: string;
  chiefComplaints?: string;
  vitalSigns?: {
    bloodPressure?: string;
    temperature?: number;
    pulse?: number;
    weight?: number;
    height?: number;
  };
  items: PrescriptionItem[];
  instructions?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
  status: PrescriptionStatus;
  dispensedStatus: DispensingStatus;
  dispensedDate?: Date;
  dispensedBy?: string;
  partiallyDispensedItems?: string[];
  cancelledReason?: string;
  digitalSignature?: string;
  digitalSignatureDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface PrescriptionItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  medicineType: string;
  strength?: string;
  dosage: Dosage;
  frequency: Frequency;
  duration: number;
  durationUnit: DurationUnit;
  totalQuantity: number;
  instructions?: string;
  beforeFood?: boolean;
  afterFood?: boolean;
  withFood?: boolean;
  sos?: boolean; // If needed
  substitutionAllowed: boolean;
  dispensedQuantity?: number;
  dispensingStatus?: ItemDispensingStatus;
  remarks?: string;
}

export interface Dosage {
  morning?: number;
  afternoon?: number;
  evening?: number;
  night?: number;
  customSchedule?: string;
}

export enum Frequency {
  ONCE_DAILY = 'Once Daily',
  TWICE_DAILY = 'Twice Daily',
  THREE_TIMES_DAILY = 'Three Times Daily',
  FOUR_TIMES_DAILY = 'Four Times Daily',
  EVERY_6_HOURS = 'Every 6 Hours',
  EVERY_8_HOURS = 'Every 8 Hours',
  EVERY_12_HOURS = 'Every 12 Hours',
  ONCE_WEEKLY = 'Once Weekly',
  AS_NEEDED = 'As Needed (SOS)',
  CUSTOM = 'Custom'
}

export enum DurationUnit {
  DAYS = 'Days',
  WEEKS = 'Weeks',
  MONTHS = 'Months'
}

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISPENSED = 'DISPENSED',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum DispensingStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  PARTIALLY_DISPENSED = 'Partially Dispensed',
  FULLY_DISPENSED = 'Fully Dispensed',
  CANCELLED = 'Cancelled'
}

export enum ItemDispensingStatus {
  PENDING = 'Pending',
  DISPENSED = 'Dispensed',
  OUT_OF_STOCK = 'Out of Stock',
  SUBSTITUTED = 'Substituted',
  CANCELLED = 'Cancelled'
}

export interface MedicineFormulary {
  id: string;
  name: string;
  genericName: string;
  medicineType: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  availableStock?: number;
  reorderLevel?: number;
  isEssential?: boolean;
  isScheduled?: boolean;
  scheduleType?: string;
  standardDosage?: Dosage;
  commonInstructions?: string[];
  contraindications?: string[];
}

export interface PrescriptionFilter {
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  doctorId?: string;
  department?: string;
  status?: PrescriptionStatus;
  dispensingStatus?: DispensingStatus;
  searchTerm?: string;
  prescriptionNumber?: string;
}

export interface PrescriptionSummary {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientRegistrationNumber: string;
  doctorName: string;
  department: string;
  visitDate: Date;
  diagnosis: string;
  itemCount: number;
  status: PrescriptionStatus;
  dispensedStatus: DispensingStatus;
}

export interface DoctorSignature {
  doctorId: string;
  doctorName: string;
  qualification: string;
  registrationNumber: string;
  signature?: string; // Base64 image or digital signature
  signedAt: Date;
}
