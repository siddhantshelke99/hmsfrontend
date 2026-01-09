/**
 * Dashboard Statistics Models
 */

export interface DashboardMetric {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  link?: string;
}

export interface AdminDashboardData {
  totalPatients: number;
  todayRegistrations: number;
  totalMedicines: number;
  lowStockCount: number;
  expiringMedicinesCount: number;
  expiredMedicinesCount: number;
  todayPrescriptions: number;
  todayDispensed: number;
  pendingDispensing: number;
  systemAlerts: SystemAlert[];
  recentActivities: AuditActivity[];
  stockValueTotal: number;
  monthlySummary: MonthlySummary;
}

export interface DoctorDashboardData {
  todayTokens: number;
  pendingConsultations: number;
  completedToday: number;
  todayPrescriptions: number;
  patientQueue: PatientQueue[];
  recentPrescriptions: PrescriptionSummary[];
  myStatistics: DoctorStatistics;
}

export interface PharmacyDashboardData {
  pendingDispensing: number;
  todayDispensed: number;
  partialDispenses: number;
  returnsToday: number;
  dispensingQueue: DispenseQueue[];
  lowStockAlerts: StockAlert[];
  expiringMedicines: ExpiringMedicine[];
  todayStatistics: PharmacyStatistics;
}

export interface SystemAlert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  module: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AuditActivity {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  timestamp: Date;
  details: string;
}

export interface PatientQueue {
  tokenNumber: string;
  patientName: string;
  registrationNumber: string;
  department: string;
  status: 'WAITING' | 'IN_PROGRESS';
  waitingTime: number; // minutes
  priority: 'NORMAL' | 'URGENT';
}

export interface DispenseQueue {
  prescriptionId: string;
  prescriptionNumber: string;
  patientName: string;
  doctorName: string;
  medicineCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'PARTIAL';
  priority: 'NORMAL' | 'URGENT';
  createdAt: Date;
}

export interface StockAlert {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  minimumLevel: number;
  category: string;
  isNarcotic: boolean;
}

export interface ExpiringMedicine {
  batchNumber: string;
  medicineName: string;
  expiryDate: Date;
  quantity: number;
  daysRemaining: number;
  location: string;
}

export interface PrescriptionSummary {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  medicineCount: number;
  createdAt: Date;
  status: 'PENDING' | 'DISPENSED' | 'PARTIAL' | 'CANCELLED';
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalPrescriptions: number;
  totalDispensed: number;
  totalValue: number;
  outsourcedCount: number;
}

export interface DoctorStatistics {
  totalPatientsToday: number;
  totalPrescriptionsToday: number;
  averageConsultationTime: number;
  mostPrescribedMedicine: string;
}

export interface PharmacyStatistics {
  totalDispensedToday: number;
  totalValueToday: number;
  averageDispenseTime: number;
  mostDispensedMedicine: string;
}
