// Report Base Interfaces

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  category?: string;
  status?: string;
  groupBy?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface ReportMetadata {
  reportId: string;
  reportName: string;
  reportType: ReportType;
  generatedDate: Date;
  generatedBy: string;
  parameters: any;
  recordCount: number;
  filePath?: string;
}

// Stock Reports

export interface StockReport {
  date: Date;
  medicines: StockReportItem[];
  summary: StockSummary;
  lowStockItems: number;
  expiringItems: number;
  outOfStockItems: number;
}

export interface StockReportItem {
  medicineId: string;
  medicineName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  lastPurchaseDate?: Date;
  lastDispenseDate?: Date;
  stockStatus: StockStatus;
  daysToStockout?: number;
}

export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  adequateStockCount: number;
  overstockCount: number;
  outOfStockCount: number;
  averageStockValue: number;
}

export interface ExpiryReport {
  date: Date;
  medicines: ExpiryReportItem[];
  summary: ExpirySummary;
}

export interface ExpiryReportItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: Date;
  daysToExpiry: number;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  location: string;
  status: ExpiryStatus;
}

export interface ExpirySummary {
  expiredCount: number;
  expiredValue: number;
  expiring30Days: number;
  expiring30Value: number;
  expiring60Days: number;
  expiring60Value: number;
  expiring90Days: number;
  expiring90Value: number;
}

export interface ABCAnalysisReport {
  date: Date;
  categoryA: ABCCategory; // Top 20% items = 80% value
  categoryB: ABCCategory; // Next 30% items = 15% value
  categoryC: ABCCategory; // Last 50% items = 5% value
  items: ABCAnalysisItem[];
}

export interface ABCCategory {
  itemCount: number;
  totalValue: number;
  percentageValue: number;
  percentageItems: number;
}

export interface ABCAnalysisItem {
  medicineId: string;
  medicineName: string;
  annualConsumption: number;
  unitPrice: number;
  annualValue: number;
  category: 'A' | 'B' | 'C';
  cumulativePercentage: number;
}

// Prescription Reports

export interface PrescriptionReport {
  startDate: Date;
  endDate: Date;
  totalPrescriptions: number;
  prescriptions: PrescriptionReportItem[];
  byDoctor: DoctorPrescriptionSummary[];
  byDepartment: { [key: string]: number };
  trends: PrescriptionTrend[];
}

export interface PrescriptionReportItem {
  prescriptionId: string;
  prescriptionNumber: string;
  prescriptionDate: Date;
  patientId: string;
  patientName: string;
  doctorName: string;
  department: string;
  medicineCount: number;
  totalQuantity: number;
  dispensingStatus: string;
  dispensedDate?: Date;
}

export interface DoctorPrescriptionSummary {
  doctorId: string;
  doctorName: string;
  department: string;
  totalPrescriptions: number;
  totalMedicines: number;
  averageMedicinesPerPrescription: number;
  mostPrescribedMedicines: Array<{ medicine: string; count: number }>;
}

export interface PrescriptionTrend {
  date: Date;
  count: number;
  averageMedicines: number;
}

export interface MedicineConsumptionReport {
  startDate: Date;
  endDate: Date;
  medicines: MedicineConsumptionItem[];
  topConsumed: MedicineConsumptionItem[];
  byCategory: { [key: string]: number };
  trends: ConsumptionTrend[];
}

export interface MedicineConsumptionItem {
  medicineId: string;
  medicineName: string;
  category: string;
  totalQuantity: number;
  totalPrescriptions: number;
  totalValue: number;
  averagePerPrescription: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface ConsumptionTrend {
  period: string;
  quantity: number;
  prescriptions: number;
  value: number;
}

// Patient Reports

export interface PatientReport {
  startDate: Date;
  endDate: Date;
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  byDepartment: DepartmentPatientSummary[];
  byAgeGroup: AgeGroupSummary[];
  byGender: GenderSummary;
  trends: PatientTrend[];
}

export interface DepartmentPatientSummary {
  department: string;
  patientCount: number;
  newPatients: number;
  averageVisitsPerPatient: number;
  commonDiagnoses: Array<{ diagnosis: string; count: number }>;
}

export interface AgeGroupSummary {
  ageGroup: string; // 0-18, 19-35, 36-50, 51-65, 65+
  patientCount: number;
  percentage: number;
  commonConditions: string[];
}

export interface GenderSummary {
  male: number;
  female: number;
  other: number;
  malePercentage: number;
  femalePercentage: number;
  otherPercentage: number;
}

export interface PatientTrend {
  date: Date;
  totalPatients: number;
  newPatients: number;
  averageAge: number;
}

export interface PatientLoadReport {
  date: Date;
  byHour: HourlyLoad[];
  byDepartment: DepartmentLoad[];
  peakHours: string[];
  averageWaitTime: number;
  totalTokens: number;
}

export interface HourlyLoad {
  hour: number;
  patientCount: number;
  tokenCount: number;
  averageWaitTime: number;
}

export interface DepartmentLoad {
  department: string;
  patientCount: number;
  averageWaitTime: number;
  doctorsAvailable: number;
  utilizationRate: number;
}

// Pharmacy Reports

export interface PharmacyReport {
  startDate: Date;
  endDate: Date;
  totalDispensing: number;
  totalAmount: number;
  dispensingRecords: DispensingReportItem[];
  byPaymentMethod: PaymentMethodSummary[];
  byPharmacist: PharmacistSummary[];
  trends: DispensingTrend[];
}

export interface DispensingReportItem {
  dispensingId: string;
  prescriptionNumber: string;
  patientName: string;
  dispensedDate: Date;
  dispensedBy: string;
  itemCount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface PaymentMethodSummary {
  method: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export interface PharmacistSummary {
  pharmacistId: string;
  pharmacistName: string;
  totalDispensing: number;
  totalAmount: number;
  averagePerDispensing: number;
  averageProcessingTime: number; // minutes
}

export interface DispensingTrend {
  date: Date;
  count: number;
  amount: number;
  averageAmount: number;
}

export interface ControlledDrugReport {
  startDate: Date;
  endDate: Date;
  drugs: ControlledDrugItem[];
  summary: ControlledDrugSummary;
}

export interface ControlledDrugItem {
  medicineId: string;
  medicineName: string;
  category: string; // Narcotic, Psychotropic, etc.
  licenseNumber?: string;
  openingStock: number;
  receipts: number;
  dispensed: number;
  returned: number;
  closingStock: number;
  discrepancy: number;
  prescriptions: number;
  compliance: boolean;
}

export interface ControlledDrugSummary {
  totalDrugs: number;
  totalDispensed: number;
  totalPrescriptions: number;
  discrepanciesFound: number;
  complianceRate: number;
  requiresAttention: number;
}

export interface RevenueReport {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  cashRevenue: number;
  digitalRevenue: number;
  freeDispensing: number;
  byCategory: CategoryRevenue[];
  byDepartment: DepartmentRevenue[];
  dailyRevenue: DailyRevenue[];
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
  transactionCount: number;
}

export interface DepartmentRevenue {
  department: string;
  revenue: number;
  percentage: number;
  patientCount: number;
}

export interface DailyRevenue {
  date: Date;
  revenue: number;
  transactionCount: number;
  averagePerTransaction: number;
}

// Outsourced Medicine Reports

export interface OutsourcedMedicineReport {
  startDate: Date;
  endDate: Date;
  totalOutsourced: number;
  totalAmount: number;
  medicines: OutsourcedMedicineItem[];
  byVendor: VendorSummary[];
  trends: OutsourcedTrend[];
}

export interface OutsourcedMedicineItem {
  medicineId: string;
  medicineName: string;
  patientName: string;
  prescriptionNumber: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  outsourcedDate: Date;
  returnDate?: Date;
  status: string;
}

export interface VendorSummary {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  totalAmount: number;
  averageResponseTime: number; // hours
  fulfillmentRate: number; // percentage
}

export interface OutsourcedTrend {
  date: Date;
  count: number;
  amount: number;
}

// Financial Reports

export interface FinancialReport {
  startDate: Date;
  endDate: Date;
  inventory: InventoryFinancials;
  revenue: RevenueFinancials;
  expenses: ExpenseFinancials;
  profitability: ProfitabilityMetrics;
}

export interface InventoryFinancials {
  openingValue: number;
  purchases: number;
  closingValue: number;
  consumed: number;
  wastage: number;
  turnoverRatio: number;
}

export interface RevenueFinancials {
  dispensingRevenue: number;
  consultationRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  growthRate: number;
}

export interface ExpenseFinancials {
  purchaseCost: number;
  operationalExpense: number;
  staffCost: number;
  otherExpense: number;
  totalExpense: number;
}

export interface ProfitabilityMetrics {
  grossProfit: number;
  netProfit: number;
  grossMargin: number; // percentage
  netMargin: number; // percentage
  roi: number; // percentage
}

// Enums

export enum ReportType {
  STOCK_REPORT = 'Stock Report',
  EXPIRY_REPORT = 'Expiry Report',
  ABC_ANALYSIS = 'ABC Analysis',
  LOW_STOCK_REPORT = 'Low Stock Report',
  PRESCRIPTION_REPORT = 'Prescription Report',
  DOCTOR_WISE_REPORT = 'Doctor-wise Report',
  MEDICINE_CONSUMPTION = 'Medicine Consumption',
  PATIENT_REPORT = 'Patient Report',
  PATIENT_LOAD = 'Patient Load Report',
  DEMOGRAPHICS = 'Demographics Report',
  PHARMACY_REPORT = 'Pharmacy Report',
  DISPENSING_REPORT = 'Dispensing Report',
  CONTROLLED_DRUG_REPORT = 'Controlled Drug Report',
  REVENUE_REPORT = 'Revenue Report',
  OUTSOURCED_REPORT = 'Outsourced Medicine Report',
  FINANCIAL_REPORT = 'Financial Report'
}

export enum StockStatus {
  OUT_OF_STOCK = 'Out of Stock',
  LOW_STOCK = 'Low Stock',
  ADEQUATE = 'Adequate',
  OVERSTOCK = 'Overstock'
}

export enum ExpiryStatus {
  EXPIRED = 'Expired',
  EXPIRING_SOON = 'Expiring Soon', // < 30 days
  EXPIRING = 'Expiring', // 30-90 days
  GOOD = 'Good' // > 90 days
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON'
}

export enum ReportPeriod {
  TODAY = 'Today',
  YESTERDAY = 'Yesterday',
  THIS_WEEK = 'This Week',
  LAST_WEEK = 'Last Week',
  THIS_MONTH = 'This Month',
  LAST_MONTH = 'Last Month',
  THIS_QUARTER = 'This Quarter',
  LAST_QUARTER = 'Last Quarter',
  THIS_YEAR = 'This Year',
  LAST_YEAR = 'Last Year',
  CUSTOM = 'Custom'
}
