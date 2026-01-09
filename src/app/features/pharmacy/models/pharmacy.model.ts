export interface DispensingQueue {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  tokenNumber?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientRegistrationNumber: string;
  doctorName: string;
  department: string;
  diagnosis: string;
  prescriptionDate: Date;
  itemCount: number;
  totalQuantity: number;
  priority: QueuePriority;
  status: DispensingQueueStatus;
  estimatedWaitTime?: number; // in minutes
  queuePosition?: number;
  assignedTo?: string;
  assignedAt?: Date;
  notes?: string;
}

export interface DispensingItem {
  id?: string;
  prescriptionItemId: string;
  medicineId: string;
  medicineName: string;
  medicineType: string;
  strength?: string;
  prescribedQuantity: number;
  dispensedQuantity: number;
  remainingQuantity: number;
  availableStock: number;
  selectedBatchId?: string;
  selectedBatchNumber?: string;
  selectedBatchExpiry?: Date;
  unitPrice?: number;
  totalPrice?: number;
  substituted: boolean;
  substituteMedicineId?: string;
  substituteMedicineName?: string;
  substituteReason?: string;
  status: ItemDispensingStatus;
  remarks?: string;
}

export interface MedicineDispense {
  id?: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  dispensingType: DispensingType;
  items: DispensingItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  dispensedBy: string;
  dispensedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  remarks?: string;
  printedCount: number;
}

export interface ReturnMedicine {
  id?: string;
  dispensingId: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  returnDate: Date;
  returnReason: ReturnReason;
  returnReasonDetails?: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundStatus: RefundStatus;
  refundMethod?: PaymentMethod;
  refundReference?: string;
  processedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
}

export interface ReturnItem {
  id?: string;
  dispensingItemId: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  dispensedQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: MedicineCondition;
  restockable: boolean;
  remarks?: string;
}

export interface DispensingHistory {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  tokenNumber?: string;
  patientId: string;
  patientName: string;
  patientRegistrationNumber: string;
  dispensedAt: Date;
  dispensedBy: string;
  dispensingStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  refundAmount?: number;
  hasReturns: boolean;
}

export interface DispensingStatistics {
  totalDispensed: number;
  totalPartialDispensed: number;
  totalAmount: number;
  averageItemsPerDispensing: number;
  topMedicines: Array<{ medicine: string; quantity: number }>;
  dispensingByHour: Array<{ hour: number; count: number }>;
  pendingCount: number;
  averageWaitTime: number; // in minutes
}

export enum QueuePriority {
  NORMAL = 'Normal',
  URGENT = 'Urgent',
  EMERGENCY = 'Emergency'
}

export enum DispensingQueueStatus {
  WAITING = 'Waiting',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled'
}

export enum ItemDispensingStatus {
  PENDING = 'Pending',
  DISPENSED = 'Dispensed',
  OUT_OF_STOCK = 'Out of Stock',
  SUBSTITUTED = 'Substituted',
  PARTIALLY_DISPENSED = 'Partially Dispensed',
  CANCELLED = 'Cancelled'
}

export enum DispensingType {
  FULL = 'Full Dispensing',
  PARTIAL = 'Partial Dispensing',
  SUBSTITUTE = 'With Substitution'
}

export enum PaymentStatus {
  FREE = 'Free',
  PAID = 'Paid',
  PENDING = 'Pending Payment',
  WAIVED = 'Payment Waived'
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  UPI = 'UPI',
  ONLINE = 'Online Banking',
  FREE = 'Free (Government Scheme)'
}

export enum ReturnReason {
  ADVERSE_REACTION = 'Adverse Reaction',
  WRONG_MEDICINE = 'Wrong Medicine Dispensed',
  DUPLICATE = 'Duplicate Dispensing',
  PATIENT_DECEASED = 'Patient Deceased',
  PRESCRIPTION_CANCELLED = 'Prescription Cancelled',
  EXPIRED = 'Medicine Expired',
  DAMAGED = 'Medicine Damaged',
  OTHER = 'Other'
}

export enum RefundStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PROCESSED = 'Processed'
}

export enum MedicineCondition {
  SEALED_UNOPENED = 'Sealed/Unopened',
  OPENED_UNUSED = 'Opened but Unused',
  PARTIALLY_USED = 'Partially Used',
  DAMAGED = 'Damaged',
  EXPIRED = 'Expired'
}

export interface DispensingFilter {
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  dispensedBy?: string;
  status?: DispensingQueueStatus;
  dispensingType?: DispensingType;
  searchTerm?: string;
}

export interface BatchSelection {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
}
