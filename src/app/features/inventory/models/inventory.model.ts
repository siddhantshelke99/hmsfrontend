/**
 * Inventory Module Models
 */

// Enums
export enum StockAdjustmentType {
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  LOSS = 'LOSS',
  THEFT = 'THEFT',
  CORRECTION = 'CORRECTION',
  RETURN = 'RETURN_TO_SUPPLIER',
  OTHER = 'OTHER'
}

export enum OutsourcedStatus {
  PENDING = 'PENDING',
  ARRANGED = 'ARRANGED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED'
}

export interface InwardEntry {
  id?: string;
  entryNumber: string;
  entryDate: Date;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceAmount: number;
  challanNumber?: string;
  purchaseOrderNumber?: string;
  items: InwardItem[];
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InwardItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  gstRate: number;
  discountPercent: number;
  totalAmount: number;
  rack?: string;
  location: string;
}

export interface StockEntry {
  id?: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  medicine?: any;
  batchNumber: string;
  manufactureDate: Date;
  expiryDate: Date;
  quantity: number;
  currentStock: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  purchasePrice: number;
  unitPrice: number;
  mrp: number;
  supplierId: string;
  supplierName: string;
  location: string;
  rack?: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'EXPIRING_SOON';
  inwardEntryId: string;
  lastUpdated: Date;
}

export interface StockAdjustment {
  id?: string;
  adjustmentNumber?: string;
  adjustmentDate?: Date;
  adjustmentType: StockAdjustmentType | string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  currentStock?: number;
  newStock?: number;
  reason: string;
  adjustedBy?: string;
  adjustedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface OutsourcedMedicine {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  strength?: string;
  quantity: number;
  requestDate: string;
  requestedBy: string;
  arrangedBy?: string;
  arrangedDate?: string;
  fulfilledDate?: string;
  reason: 'OUT_OF_STOCK' | 'NOT_AVAILABLE' | 'EXPIRED_BATCH';
  supplierName?: string;
  supplierContact?: string;
  estimatedCost?: number;
  actualCost?: number;
  status: OutsourcedStatus;
  remarks?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  dlNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
}

export interface StockFilter {
  searchTerm?: string;
  medicineName?: string;
  category?: string;
  status?: string;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  lowStock?: boolean;
  expired?: boolean;
  expiringSoon?: boolean;
}

export interface InwardFilter {
  entryNumber?: string;
  supplierName?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface StockReport {
  medicineName: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalValue: number;
  batches: number;
  nearExpiry: number;
  expired: number;
}
