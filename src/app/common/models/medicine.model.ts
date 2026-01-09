export interface Medicine {
  id?: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: MedicineCategory;
  type: MedicineType;
  strength: string;
  unit: string;
  hsnCode?: string;
  isNarcotic: boolean;
  requiresPrescription: boolean;
  storageConditions?: string;
  minimumStockLevel: number;
  reorderLevel: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum MedicineCategory {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  INJECTION = 'INJECTION',
  OINTMENT = 'OINTMENT',
  DROPS = 'DROPS',
  INHALER = 'INHALER',
  POWDER = 'POWDER',
  OTHER = 'OTHER'
}

export enum MedicineType {
  ALLOPATHIC = 'ALLOPATHIC',
  AYURVEDIC = 'AYURVEDIC',
  HOMEOPATHIC = 'HOMEOPATHIC',
  UNANI = 'UNANI'
}

export interface MedicineStock {
  id?: string;
  medicineId: string;
  medicine?: Medicine;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  supplierId?: string;
  supplierName?: string;
  location: string;
  rack?: string;
  status: 'AVAILABLE' | 'EXPIRED' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated?: Date;
}

export interface MedicineSearchCriteria {
  name?: string;
  genericName?: string;
  category?: MedicineCategory;
  isNarcotic?: boolean;
}
