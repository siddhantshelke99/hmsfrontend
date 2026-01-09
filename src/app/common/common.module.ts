import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Standalone Components
import { LoaderComponent } from './components/loader/loader.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { PatientSearchComponent } from './components/patient-search/patient-search.component';
import { MedicineSearchComponent } from './components/medicine-search/medicine-search.component';

// Core Services
import { AuditLogService } from './services/audit-log.service';
import { NotificationService } from './services/notification.service';
import { ApiService } from './services/api.service';

// Component Services
import { LoaderService } from './components/loader/loader.service';
import { PatientSearchService } from './components/patient-search/patient-search.service';
import { MedicineSearchService } from './components/medicine-search/medicine-search.service';

/**
 * GHIPAS Common Module
 * Contains shared components, services, and models for the application
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Standalone components
    LoaderComponent,
    PatientSearchComponent,
    MedicineSearchComponent
  ],
  exports: [
    // Export for use in other modules
    LoaderComponent,
    PatientSearchComponent,
    MedicineSearchComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    // Core Services
    AuditLogService,
    NotificationService,
    ApiService,
    // Component Services
    LoaderService,
    PatientSearchService,
    MedicineSearchService,
    // Dialog Service (Injectable)
    ConfirmDialogComponent
  ]
})
export class GhipasCommonModule { }
