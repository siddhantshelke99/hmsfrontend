import { Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { DefaultComponent } from './dashboard/default/default.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { DoctorDashboardComponent } from './dashboard/doctor-dashboard/doctor-dashboard.component';
import { PharmacyDashboardComponent } from './dashboard/pharmacy-dashboard/pharmacy-dashboard.component';

// Inventory Components
import { InwardListComponent } from './features/inventory/inward/inward-list.component';
import { InwardCreateComponent } from './features/inventory/inward/inward-create.component';
import { UploadInvoiceComponent } from './features/inventory/inward/upload-invoice.component';
import { StockListComponent } from './features/inventory/stock/stock-list.component';
import { StockAdjustmentComponent } from './features/inventory/adjustment/stock-adjustment.component';
import { OutsourcedMedicineListComponent } from './features/inventory/outsourced/outsourced-medicine-list.component';

// Patients Components
import { PatientRegistrationComponent } from './features/patients/registration/patient-registration.component';
import { TokenGenerationComponent } from './features/patients/token/token-generation.component';
import { PatientHistoryComponent } from './features/patients/history/patient-history.component';

// Prescriptions Components
import { PrescriptionCreateComponent } from './features/prescriptions/prescription-create/prescription-create.component';
import { PrescriptionListComponent } from './features/prescriptions/prescription-list/prescription-list.component';
import { PrescriptionDetailsComponent } from './features/prescriptions/prescription-details/prescription-details.component';

// Pharmacy Components
import { DispensingQueueComponent } from './features/pharmacy/dispensing-queue/dispensing-queue.component';
import { DispenseMedicineComponent } from './features/pharmacy/dispense-medicine/dispense-medicine.component';
import { ReturnMedicineComponent } from './features/pharmacy/return-medicine/return-medicine.component';
import { DispensingHistoryComponent } from './features/pharmacy/dispensing-history/dispensing-history.component';

// Audit Components
import { AuditTrailComponent } from './features/audit/audit-trail/audit-trail.component';
import { ComplianceReportsComponent } from './features/audit/compliance-reports/compliance-reports.component';
import { TheftAlertsComponent } from './features/audit/theft-alerts/theft-alerts.component';

// Reports Components
import { StockReportsComponent } from './features/reports/stock-reports/stock-reports.component';
import { PrescriptionReportsComponent } from './features/reports/prescription-reports/prescription-reports.component';
import { PatientReportsComponent } from './features/reports/patient-reports/patient-reports.component';
import { PharmacyReportsComponent } from './features/reports/pharmacy-reports/pharmacy-reports.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./authentication/authentication.module').then((m) => m.AuthenticationModule)
  },
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'default',
        component: DefaultComponent
      },
      // Dashboard Routes
      {
        path: 'dashboard/admin',
        component: AdminDashboardComponent
        // TODO: Add auth guard: canActivate: [AuthGuard], data: { role: 'ADMIN' }
      },
      {
        path: 'dashboard/doctor',
        component: DoctorDashboardComponent
        // TODO: Add auth guard: canActivate: [AuthGuard], data: { role: 'DOCTOR' }
      },
      {
        path: 'dashboard/pharmacy',
        component: PharmacyDashboardComponent
        // TODO: Add auth guard: canActivate: [AuthGuard], data: { role: 'PHARMACY' }
      },
      
      // Inventory Routes
      {
        path: 'inventory/inward',
        component: InwardListComponent
        // TODO: Add auth guard for ADMIN/PHARMACY roles
      },
      {
        path: 'inventory/inward/create',
        component: InwardCreateComponent
        // TODO: Add auth guard for ADMIN role
      },
      {
        path: 'inventory/inward/upload',
        component: UploadInvoiceComponent
        // TODO: Add auth guard for ADMIN role
      },
      {
        path: 'inventory/stock',
        component: StockListComponent
        // TODO: Add auth guard for ADMIN/PHARMACY/DOCTOR roles
      },
      {
        path: 'inventory/adjustments/create',
        component: StockAdjustmentComponent
        // TODO: Add auth guard for ADMIN/PHARMACY roles
      },
      {
        path: 'inventory/outsourced',
        component: OutsourcedMedicineListComponent
        // TODO: Add auth guard for PHARMACY role
      },
      
      // Patients Routes
      {
        path: 'patients/registration',
        component: PatientRegistrationComponent
        // TODO: Add auth guard for ADMIN/RECEPTIONIST roles
      },
      {
        path: 'patients/token/generate',
        component: TokenGenerationComponent
      },
   
      {
        path: 'patients/token/generate/:patientId',
        component: TokenGenerationComponent
        // TODO: Add auth guard for RECEPTIONIST/NURSE roles
      },
      {
        path: 'patients/history',
        component: PatientHistoryComponent // Create a list component where user selects a patient
      },
      {
        path: 'patients/history/:id',
        component: PatientHistoryComponent
        // TODO: Add auth guard for DOCTOR/ADMIN roles
      },
      
      // Prescriptions Routes
      {
        path: 'prescriptions/create',
        component: PrescriptionCreateComponent
        // TODO: Add auth guard for DOCTOR role
      },
      {
        path: 'prescriptions/create/:patientId',
        component: PrescriptionCreateComponent
        // TODO: Add auth guard for DOCTOR role
      },
      {
        path: 'prescriptions/list',
        component: PrescriptionListComponent
        // TODO: Add auth guard for DOCTOR/ADMIN/PHARMACY roles
      },
      {
        path: 'prescriptions/details/:id',
        component: PrescriptionDetailsComponent
        // TODO: Add auth guard for DOCTOR/ADMIN/PHARMACY roles
      },
      
      // Pharmacy Routes
      {
        path: 'pharmacy/queue',
        component: DispensingQueueComponent
        // TODO: Add auth guard for PHARMACY role
      },
      {
        path: 'pharmacy/dispense/:prescriptionId',
        component: DispenseMedicineComponent
        // TODO: Add auth guard for PHARMACY role
      },
      {
        path: 'pharmacy/returns',
        component: ReturnMedicineComponent
        // TODO: Add auth guard for PHARMACY role
      },
      {
        path: 'pharmacy/history',
        component: DispensingHistoryComponent
        // TODO: Add auth guard for PHARMACY/ADMIN roles
      },
      
      // Audit Routes
      {
        path: 'audit/trail',
        component: AuditTrailComponent
        // TODO: Add auth guard for ADMIN/AUDITOR roles
      },
      {
        path: 'audit/compliance',
        component: ComplianceReportsComponent
        // TODO: Add auth guard for ADMIN/AUDITOR roles
      },
      {
        path: 'audit/theft-alerts',
        component: TheftAlertsComponent
        // TODO: Add auth guard for ADMIN/AUDITOR roles
      },
      
      // Reports Routes
      {
        path: 'reports/stock',
        component: StockReportsComponent
        // TODO: Add auth guard for ADMIN/PHARMACY roles
      },
      {
        path: 'reports/prescriptions',
        component: PrescriptionReportsComponent
        // TODO: Add auth guard for ADMIN/DOCTOR roles
      },
      {
        path: 'reports/patients',
        component: PatientReportsComponent
        // TODO: Add auth guard for ADMIN/DOCTOR roles
      },
      {
        path: 'reports/pharmacy',
        component: PharmacyReportsComponent
        // TODO: Add auth guard for ADMIN/PHARMACY roles
      },
      
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
