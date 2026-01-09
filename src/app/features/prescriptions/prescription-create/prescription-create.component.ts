import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

import { PatientSearchComponent, LoaderComponent } from '@app/common';
import { Patient } from '@app/common/models/patient.model';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PrescriptionService } from '../services/prescription.service';
import {
  Prescription,
  PrescriptionItem,
  MedicineFormulary,
  PrescriptionStatus,
  DispensingStatus,
  Frequency,
  DurationUnit
} from '../models/prescription.model';

@Component({
  selector: 'app-prescription-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PatientSearchComponent, LoaderComponent],
  templateUrl: './prescription-create.component.html',
  styleUrls: ['./prescription-create.component.scss']
})
export class PrescriptionCreateComponent implements OnInit, OnDestroy {
  prescriptionForm!: FormGroup;
  selectedPatient: Patient | null = null;
  medicineSearchResults: MedicineFormulary[] = [];
  isLoading = false;
  isSubmitting = false;
  
  frequencies = Object.values(Frequency);
  durationUnits = Object.values(DurationUnit);
  
  departments = [
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
    'Dermatology',
    'ENT',
    'Ophthalmology',
    'Psychiatry',
    'Surgery',
    'Casualty',
    'Others'
  ];

  private destroy$ = new Subject<void>();
  private patientId?: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId') || undefined;
    
    if (this.patientId) {
      // If patientId provided in route, load patient details
      this.loadPatientForPrescription(this.patientId);
    }

    this.logAudit(AuditAction.ACCESS, 'Accessed prescription create page');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.prescriptionForm = this.fb.group({
      patientInfo: this.fb.group({
        patientId: ['', Validators.required],
        patientName: [{ value: '', disabled: true }],
        registrationNumber: [{ value: '', disabled: true }],
        age: [{ value: '', disabled: true }],
        gender: [{ value: '', disabled: true }]
      }),
      doctorInfo: this.fb.group({
        doctorId: ['', Validators.required],
        doctorName: ['', Validators.required],
        qualification: [''],
        registrationNumber: [''],
        department: ['', Validators.required]
      }),
      clinicalDetails: this.fb.group({
        chiefComplaints: ['', Validators.required],
        diagnosis: ['', Validators.required],
        bloodPressure: [''],
        temperature: [''],
        pulse: [''],
        weight: [''],
        height: ['']
      }),
      items: this.fb.array([]),
      additionalInfo: this.fb.group({
        instructions: [''],
        followUpDate: [''],
        followUpInstructions: ['']
      })
    });
  }

  get items(): FormArray {
    return this.prescriptionForm.get('items') as FormArray;
  }

  onPatientSelected(patient: Patient): void {
    this.selectedPatient = patient;
    
    const patientInfoGroup = this.prescriptionForm.get('patientInfo') as FormGroup;
    patientInfoGroup.patchValue({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      registrationNumber: patient.registrationNumber,
      age: patient.age || this.calculateAge(patient.dateOfBirth),
      gender: patient.gender
    });

    this.logAudit(AuditAction.VIEW, `Selected patient: ${patient.registrationNumber} - ${patient.firstName} ${patient.lastName}`);
  }

  private loadPatientForPrescription(patientId: string): void {
    // In real implementation, load from PatientService
    // For now, set as if patient was selected
    this.prescriptionForm.get('patientInfo.patientId')?.setValue(patientId);
  }

  searchMedicines(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      this.medicineSearchResults = [];
      return;
    }

    this.isLoading = true;
    this.prescriptionService.searchFormulary(searchTerm, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.medicineSearchResults = results;
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to search medicines', error.message);
          this.isLoading = false;
        }
      });
  }

  addMedicine(medicine: MedicineFormulary): void {
    // Check if medicine already added
    const existingItem = this.items.controls.find(
      item => item.get('medicineId')?.value === medicine.id
    );

    if (existingItem) {
      this.notificationService.warning('Already Added', 'Medicine already added to prescription');
      return;
    }

    const itemGroup = this.fb.group({
      medicineId: [medicine.id, Validators.required],
      medicineName: [medicine.name, Validators.required],
      medicineType: [medicine.medicineType],
      strength: [medicine.strength],
      dosageMorning: [medicine.standardDosage?.morning || 0],
      dosageAfternoon: [medicine.standardDosage?.afternoon || 0],
      dosageEvening: [medicine.standardDosage?.evening || 0],
      dosageNight: [medicine.standardDosage?.night || 0],
      frequency: [Frequency.THREE_TIMES_DAILY, Validators.required],
      duration: [5, [Validators.required, Validators.min(1)]],
      durationUnit: [DurationUnit.DAYS, Validators.required],
      totalQuantity: [{ value: 0, disabled: true }],
      instructions: [medicine.commonInstructions?.[0] || ''],
      beforeFood: [false],
      afterFood: [true],
      withFood: [false],
      sos: [false],
      substitutionAllowed: [true],
      availableStock: [{ value: medicine.availableStock || 0, disabled: true }]
    });

    // Calculate total quantity when dosage or duration changes
    itemGroup.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.calculateItemQuantity(itemGroup);
      });

    this.items.push(itemGroup);
    this.calculateItemQuantity(itemGroup);
    this.medicineSearchResults = [];

    this.logAudit(AuditAction.VIEW, `Added medicine: ${medicine.name} to prescription`);
  }

  private calculateItemQuantity(itemGroup: FormGroup): void {
    const morning = itemGroup.get('dosageMorning')?.value || 0;
    const afternoon = itemGroup.get('dosageAfternoon')?.value || 0;
    const evening = itemGroup.get('dosageEvening')?.value || 0;
    const night = itemGroup.get('dosageNight')?.value || 0;
    const duration = itemGroup.get('duration')?.value || 0;
    const durationUnit = itemGroup.get('durationUnit')?.value || DurationUnit.DAYS;

    const totalQuantity = this.prescriptionService.calculateTotalQuantity(
      morning,
      afternoon,
      evening,
      night,
      duration,
      durationUnit
    );

    itemGroup.get('totalQuantity')?.setValue(totalQuantity, { emitEvent: false });

    // Warn if quantity exceeds available stock
    const availableStock = itemGroup.get('availableStock')?.value || 0;
    if (totalQuantity > availableStock) {
      const medicineName = itemGroup.get('medicineName')?.value;
      this.notificationService.warning(
        'Stock Warning',
        `${medicineName}: Required quantity (${totalQuantity}) exceeds available stock (${availableStock})`
      );
    }
  }

  removeMedicine(index: number): void {
    const medicineName = this.items.at(index).get('medicineName')?.value;
    
    Swal.fire({
      title: 'Remove Medicine?',
      text: `Remove ${medicineName} from prescription?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.items.removeAt(index);
        this.logAudit(AuditAction.DELETE, `Removed medicine: ${medicineName} from prescription`);
      }
    });
  }

  async savePrescription(saveAs: 'DRAFT' | 'ACTIVE'): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    if (saveAs === 'ACTIVE' && this.items.length === 0) {
      this.notificationService.error('Medicines Required', 'Please add at least one medicine to the prescription');
      return;
    }

    // Confirm before saving active prescription
    if (saveAs === 'ACTIVE') {
      const result = await Swal.fire({
        title: 'Confirm Prescription',
        html: `
          <div class="text-start">
            <p><strong>Patient:</strong> ${this.prescriptionForm.get('patientInfo.patientName')?.value}</p>
            <p><strong>Diagnosis:</strong> ${this.prescriptionForm.get('clinicalDetails.diagnosis')?.value}</p>
            <p><strong>Medicines:</strong> ${this.items.length}</p>
            <p class="text-danger mt-3">Once confirmed, this prescription will be sent to pharmacy for dispensing.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirm & Send to Pharmacy',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    this.isSubmitting = true;
    const prescription = this.preparePrescriptionData(saveAs);

    this.prescriptionService.createPrescription(prescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (saved) => {
          this.isSubmitting = false;
          
          const message = saveAs === 'DRAFT' 
            ? 'Prescription saved as draft' 
            : 'Prescription created successfully';
          
          this.notificationService.success('Success', message);
          this.logAudit(
            AuditAction.CREATE,
            `Created prescription: ${saved.prescriptionNumber} for patient ${saved.patientRegistrationNumber}`
          );

          if (saveAs === 'ACTIVE') {
            // Show print option
            Swal.fire({
              title: 'Prescription Created',
              text: 'Would you like to print the prescription now?',
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: 'Print',
              cancelButtonText: 'View Details'
            }).then((result) => {
              if (result.isConfirmed) {
                this.printPrescription(saved.id!);
              } else {
                this.router.navigate(['/prescriptions/details', saved.id]);
              }
            });
          } else {
            this.router.navigate(['/prescriptions/list']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.notificationService.error('Failed to create prescription', error.message);
          this.logAudit(AuditAction.ERROR, `Failed to create prescription: ${error.message}`);
        }
      });
  }

  private preparePrescriptionData(status: 'DRAFT' | 'ACTIVE'): Prescription {
    const formValue = this.prescriptionForm.getRawValue();
    
    const prescriptionItems: PrescriptionItem[] = formValue.items.map((item: any) => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      medicineType: item.medicineType,
      strength: item.strength,
      dosage: {
        morning: item.dosageMorning,
        afternoon: item.dosageAfternoon,
        evening: item.dosageEvening,
        night: item.dosageNight
      },
      frequency: item.frequency,
      duration: item.duration,
      durationUnit: item.durationUnit,
      totalQuantity: item.totalQuantity,
      instructions: item.instructions,
      beforeFood: item.beforeFood,
      afterFood: item.afterFood,
      withFood: item.withFood,
      sos: item.sos,
      substitutionAllowed: item.substitutionAllowed
    }));

    const prescription: Prescription = {
      prescriptionNumber: '', // Will be generated by backend
      patientId: formValue.patientInfo.patientId,
      patientName: formValue.patientInfo.patientName,
      patientAge: formValue.patientInfo.age,
      patientGender: formValue.patientInfo.gender,
      patientRegistrationNumber: formValue.patientInfo.registrationNumber,
      doctorId: formValue.doctorInfo.doctorId,
      doctorName: formValue.doctorInfo.doctorName,
      doctorQualification: formValue.doctorInfo.qualification,
      doctorRegistrationNumber: formValue.doctorInfo.registrationNumber,
      department: formValue.doctorInfo.department,
      visitDate: new Date(),
      chiefComplaints: formValue.clinicalDetails.chiefComplaints,
      diagnosis: formValue.clinicalDetails.diagnosis,
      vitalSigns: {
        bloodPressure: formValue.clinicalDetails.bloodPressure,
        temperature: formValue.clinicalDetails.temperature,
        pulse: formValue.clinicalDetails.pulse,
        weight: formValue.clinicalDetails.weight,
        height: formValue.clinicalDetails.height
      },
      items: prescriptionItems,
      instructions: formValue.additionalInfo.instructions,
      followUpDate: formValue.additionalInfo.followUpDate,
      followUpInstructions: formValue.additionalInfo.followUpInstructions,
      status: status === 'DRAFT' ? PrescriptionStatus.DRAFT : PrescriptionStatus.ACTIVE,
      dispensedStatus: DispensingStatus.PENDING
    };

    return prescription;
  }

  private validateForm(): boolean {
    if (this.prescriptionForm.invalid) {
      this.prescriptionForm.markAllAsTouched();
      this.notificationService.error('Validation Error', 'Please fill all required fields');
      return false;
    }

    if (!this.selectedPatient) {
      this.notificationService.error('Patient Required', 'Please select a patient');
      return false;
    }

    return true;
  }

  printPrescription(prescriptionId: string): void {
    this.prescriptionService.printPrescription(prescriptionId);
  }

  cancel(): void {
    if (this.prescriptionForm.dirty) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to cancel?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Cancel',
        cancelButtonText: 'No, Continue Editing'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/prescriptions/list']);
        }
      });
    } else {
      this.router.navigate(['/prescriptions/list']);
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PRESCRIPTION,
      'Prescription',
      '',
      details
    ).subscribe();
  }
}
