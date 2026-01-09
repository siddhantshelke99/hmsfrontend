/**
 * GHIPAS Common Module - Public API
 * Export all public interfaces, components, and services
 */

// Module
export { GhipasCommonModule } from './common.module';

// Models
export * from './models/audit-log.model';
export * from './models/patient.model';
export * from './models/medicine.model';

// Core Services
export { AuditLogService } from './services/audit-log.service';
export { NotificationService, Notification } from './services/notification.service';
export { ApiService } from './services/api.service';

// Component Services
export { LoaderService, LoaderState } from './components/loader/loader.service';
export { PatientSearchService } from './components/patient-search/patient-search.service';
export { MedicineSearchService } from './components/medicine-search/medicine-search.service';

// Components
export { LoaderComponent } from './components/loader/loader.component';
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
export { PatientSearchComponent } from './components/patient-search/patient-search.component';
export { MedicineSearchComponent } from './components/medicine-search/medicine-search.component';
