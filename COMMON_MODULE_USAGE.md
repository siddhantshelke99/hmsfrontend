# GHIPAS Common Module - Usage Guide

## 📦 Module Structure

### ✅ Two Separate Modules:
1. **`src/app/common/`** - GHIPAS-specific common module (`GhipasCommonModule`)
2. **`src/app/theme/shared/`** - Theme/UI shared module (existing `SharedModule`)

### 📁 GHIPAS Common Module Structure:
```
src/app/common/
├── common.module.ts (renamed from shared.module.ts)
├── index.ts (public API exports)
├── components/
│   ├── loader/
│   │   ├── loader.component.ts
│   │   ├── loader.component.html
│   │   ├── loader.component.scss
│   │   └── loader.service.ts ✨ NEW
│   ├── confirm-dialog/
│   │   ├── confirm-dialog.component.ts (SweetAlert2 service)
│   │   ├── confirm-dialog.component.html
│   │   └── confirm-dialog.component.scss
│   ├── patient-search/
│   │   ├── patient-search.component.ts
│   │   ├── patient-search.component.html
│   │   ├── patient-search.component.scss
│   │   └── patient-search.service.ts ✨ NEW
│   └── medicine-search/
│       ├── medicine-search.component.ts
│       ├── medicine-search.component.html
│       ├── medicine-search.component.scss
│       └── medicine-search.service.ts ✨ NEW
├── services/
│   ├── audit-log.service.ts
│   ├── notification.service.ts
│   └── api.service.ts
└── models/
    ├── audit-log.model.ts
    ├── patient.model.ts
    └── medicine.model.ts
```

---

## 🔧 Import from Common Module

### Recommended Import Pattern:
```typescript
// Import from index (cleaner)
import { 
  GhipasCommonModule,
  AuditLogService,
  PatientSearchService,
  Patient,
  Medicine
} from '@app/common';

// Or direct imports
import { PatientSearchService } from '@app/common/components/patient-search/patient-search.service';
import { AuditLogService } from '@app/common/services/audit-log.service';
```

---

## ✨ NEW: Component Services

---

## ✨ NEW: Component Services

### 1. LoaderService
**Centralized loader state management**

```typescript
import { LoaderService } from '@app/common';

constructor(private loaderService: LoaderService) {}

// Show loader
this.loaderService.show('Processing...', true); // with overlay

// Hide loader
this.loaderService.hide();

// Check if visible
if (this.loaderService.isVisible()) {
  // loader is showing
}
```

### 2. PatientSearchService
**Advanced patient search and state management**

```typescript
import { PatientSearchService } from '@app/common';

constructor(private patientService: PatientSearchService) {}

// Search patients
this.patientService.searchPatients('John').subscribe(patients => {
  console.log(patients);
});

// Get patient by ID
this.patientService.getPatientById('123').subscribe(patient => {
  console.log(patient);
});

// Subscribe to selected patient changes
this.patientService.selectedPatient$.subscribe(patient => {
  this.currentPatient = patient;
});

// Set selected patient (shared across components)
this.patientService.setSelectedPatient(patient);

// Get patient history
this.patientService.getPatientHistory('patient-123').subscribe(history => {
  console.log(history);
});

// Verify patient exists
this.patientService.verifyPatient('REG-001').subscribe(exists => {
  if (exists) {
    // proceed
  }
});
```

### 3. MedicineSearchService
**Medicine and stock management**

```typescript
import { MedicineSearchService } from '@app/common';

constructor(private medicineService: MedicineSearchService) {}

// Search medicines
this.medicineService.searchMedicines('Paracetamol').subscribe(medicines => {
  console.log(medicines);
});

// Get available stock
this.medicineService.getAvailableStock('med-123').subscribe(stocks => {
  console.log('Available batches:', stocks);
});

// Get expiring medicines
this.medicineService.getExpiringMedicines().subscribe(expiring => {
  console.log('Medicines expiring soon:', expiring);
});

// Get low stock medicines
this.medicineService.getLowStockMedicines().subscribe(lowStock => {
  console.log('Low stock alert:', lowStock);
});

// Subscribe to selected medicine
this.medicineService.selectedMedicine$.subscribe(medicine => {
  this.currentMedicine = medicine;
});

// Subscribe to selected stock batch
this.medicineService.selectedStock$.subscribe(stock => {
  this.currentBatch = stock;
});

// Check expiry
if (this.medicineService.isExpired(expiryDate)) {
  // medicine expired
}

if (this.medicineService.isExpiringSoon(expiryDate)) {
  // medicine expiring within 90 days
}

// Get medicine alternatives
this.medicineService.getMedicineAlternatives('med-123').subscribe(alternatives => {
  console.log('Alternative medicines:', alternatives);
});
```

---

## ✅ Models (TypeScript Interfaces)

## 🔧 How to Use Components

### 1. ConfirmDialogComponent (SweetAlert2)

**Import in your component:**
```typescript
import { ConfirmDialogComponent } from '@app/common/components/confirm-dialog/confirm-dialog.component';

constructor(private confirmDialog: ConfirmDialogComponent) {}

// Basic confirmation
async deleteItem() {
  const confirmed = await this.confirmDialog.confirm(
    'Delete Item',
    'Are you sure you want to delete this item?',
    'Yes, Delete',
    'Cancel',
    'warning'
  );
  
  if (confirmed) {
    // Proceed with deletion
  }
}

// Delete confirmation (red button)
async deleteRecord() {
  const confirmed = await this.confirmDialog.confirmDelete(
    'Delete Record',
    'This action cannot be undone!'
  );
  
  if (confirmed) {
    // Delete logic
  }
}

// Success message
this.confirmDialog.success('Success!', 'Operation completed successfully');

// Error message
this.confirmDialog.error('Error!', 'Something went wrong');

// Loading
this.confirmDialog.showLoading('Processing...', 'Please wait');
setTimeout(() => this.confirmDialog.close(), 2000);
```

### 2. PatientSearchComponent

**In template:**
```html
<app-patient-search
  [placeholder]="'Search patient by reg no, name, or contact'"
  [showAdvancedSearch]="true"
  (patientSelected)="onPatientSelected($event)">
</app-patient-search>
```

**In component:**
```typescript
import { Patient } from '@app/common/models/patient.model';

onPatientSelected(patient: Patient): void {
  console.log('Selected patient:', patient);
  this.selectedPatient = patient;
}
```

### 3. MedicineSearchComponent

**In template:**
```html
<app-medicine-search
  [placeholder]="'Search medicine'"
  [showStockInfo]="true"
  [showAdvancedSearch]="true"
  (medicineSelected)="onMedicineSelected($event)"
  (stockSelected)="onStockSelected($event)">
</app-medicine-search>
```

**In component:**
```typescript
import { Medicine, MedicineStock } from '@app/common/models/medicine.model';

onMedicineSelected(medicine: Medicine): void {
  this.selectedMedicine = medicine;
}

onStockSelected(stock: MedicineStock): void {
  this.selectedStock = stock;
  // Use this batch for dispensing
}
```

### 4. LoaderComponent

**In template:**
```html
<!-- Simple loader -->
<app-loader *ngIf="isLoading" message="Loading data..."></app-loader>

<!-- Full screen overlay -->
<app-loader 
  *ngIf="isProcessing" 
  message="Processing request..." 
  size="lg" 
  [overlay]="true">
</app-loader>

<!-- Small loader -->
<app-loader size="sm" message="Saving..."></app-loader>
```

---

## 📝 How to Use Services

### 1. AuditLogService

**Import and inject:**
```typescript
import { AuditLogService } from '@app/common/services/audit-log.service';
import { AuditAction, AuditModule } from '@app/common/models/audit-log.model';

constructor(private auditLog: AuditLogService) {}

// Log an action
createPrescription(prescription: any) {
  this.apiService.post('/prescriptions', prescription).subscribe({
    next: (result) => {
      // ✅ LOG THE ACTION
      this.auditLog.logAction(
        AuditAction.CREATE,
        AuditModule.PRESCRIPTION,
        'Prescription',
        result.id,
        `Created prescription for patient ${prescription.patientId}`,
        null,
        result
      ).subscribe();
    }
  });
}

// Log update with old and new values
updateStock(stockId: string, oldValue: any, newValue: any) {
  this.apiService.put(`/stock/${stockId}`, newValue).subscribe({
    next: () => {
      this.auditLog.logAction(
        AuditAction.ADJUST,
        AuditModule.INVENTORY,
        'Stock',
        stockId,
        'Stock adjustment',
        oldValue,
        newValue
      ).subscribe();
    }
  });
}
```

### 2. NotificationService

**Import and inject:**
```typescript
import { NotificationService } from '@app/common/services/notification.service';

constructor(private notification: NotificationService) {}

// Success notification
saveData() {
  this.apiService.post('/data', data).subscribe({
    next: () => {
      this.notification.success('Success', 'Data saved successfully');
    },
    error: (err) => {
      this.notification.error('Error', 'Failed to save data');
    }
  });
}

// Warning
this.notification.warning('Warning', 'Stock level is low');

// Info
this.notification.info('Info', 'New update available');
```

### 3. ApiService

**Import and inject:**
```typescript
import { ApiService } from '@app/common/services/api.service';

constructor(private api: ApiService) {}

// GET request
getPatients() {
  this.api.get<Patient[]>('/patients').subscribe(patients => {
    this.patients = patients;
  });
}

// POST request
createPatient(patient: Patient) {
  this.api.post<Patient>('/patients', patient).subscribe(result => {
    console.log('Created:', result);
  });
}

// PUT request
updatePatient(id: string, patient: Patient) {
  this.api.put<Patient>(`/patients/${id}`, patient).subscribe();
}

// DELETE request
deletePatient(id: string) {
  this.api.delete(`/patients/${id}`).subscribe();
}

// Upload file
uploadInvoice(file: File) {
  this.api.uploadFile('/inventory/upload-invoice', file, { type: 'invoice' })
    .subscribe(result => {
      console.log('Uploaded:', result);
    });
}
```

---

## 📋 CMD Commands for Angular CLI

Since PowerShell scripts are disabled, use these **CMD commands** instead:

```cmd
REM Navigate to project
cd e:\frontend

REM Generate a component
node_modules\.bin\ng generate component features\inventory\inward-list

REM Generate a service
node_modules\.bin\ng generate service features\inventory\inventory

REM Generate a module
node_modules\.bin\ng generate module features\inventory --routing

REM Generate standalone component
node_modules\.bin\ng generate component common\components\notification --standalone

REM Serve the application
node_modules\.bin\ng serve

REM Build for production
node_modules\.bin\ng build --configuration production
```

**Alternative: Use npm scripts**
```cmd
npm run ng -- generate component features\inventory\inward-list
npm run start
npm run build
```

---

## ✅ Common Module Setup Complete!

**What's Done:**
- ✅ Models (Patient, Medicine, AuditLog)
- ✅ Services (API, AuditLog, Notification)
- ✅ Components (Loader, ConfirmDialog with Swal, PatientSearch, MedicineSearch)
- ✅ Shared module exported

**Ready for Next Phase:**
- Dashboard components (Admin, Doctor, Pharmacy)
- Inventory module
- Prescription module
- Pharmacy module

---

## 🎯 Next Steps

Confirm when ready to proceed with:
**Phase 2: Dashboard Components**
- AdminDashboardComponent
- DoctorDashboardComponent  
- PharmacyDashboardComponent

Type "proceed" or "continue" when ready! 🚀
