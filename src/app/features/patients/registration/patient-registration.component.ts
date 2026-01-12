import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { ConfirmDialogComponent, LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent],
  templateUrl: './patient-registration.component.html',
  styleUrls: ['./patient-registration.component.scss']
})
export class PatientRegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  isSubmitting: boolean = false;
  photoPreview: string | null = null;
  selectedPhotoFile: File | null = null;
  selectedAadharFile: File | null = null;
  aadharVerified: boolean = false;
  checkingDuplicate: boolean = false;
  maxDate: string = new Date().toISOString().split('T')[0];

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService,
    private router: Router,

  ) {
    this.initForm();
  }

  ngOnInit(): void { }

  initForm(): void {
    this.registrationForm = this.fb.group({
      // Personal Details
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      age: [{ value: '', disabled: true }],
      gender: ['', Validators.required],
      bloodGroup: [''],

      // Contact Details
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      alternateNumber: ['', Validators.pattern(/^[6-9]\d{9}$/)],
      email: ['', Validators.email],

      // Address
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],

      // Identity
      aadharNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],

      // Emergency Contact
      emergencyContactName: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      emergencyContactRelation: ['', Validators.required],

      // Medical Info (optional)
      allergies: [''],
      chronicConditions: [''],
      currentMedications: [''],

      // Other
      remarks: ['']
    });

    // Auto-calculate age when DOB changes
    this.registrationForm.get('dateOfBirth')?.valueChanges.subscribe(dob => {
      if (dob) {
        const age = this.calculateAge(new Date(dob));
        this.registrationForm.patchValue({ age }, { emitEvent: false });
      }
    });
  }

  calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.confirmDialog.warning('Invalid File', 'Please select an image file (JPG, PNG)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        this.confirmDialog.warning('File Too Large', 'Photo size must be less than 2MB');
        return;
      }

      this.selectedPhotoFile = file;

      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onAadharFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.confirmDialog.warning('Invalid File', 'Please upload PDF, JPG, or PNG file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.confirmDialog.warning('File Too Large', 'File size must be less than 5MB');
        return;
      }
      this.selectedAadharFile = file;
    }
  }

  async verifyAadhar(): Promise<void> {
    const aadharNumber = this.registrationForm.get('aadharNumber')?.value;
    if (!aadharNumber || aadharNumber.length !== 12) {
      this.confirmDialog.warning('Invalid Aadhar', 'Please enter a valid 12-digit Aadhar number');
      return;
    }

    this.patientService.verifyAadhar(aadharNumber).subscribe({
      next: (result) => {
        if (result.valid) {
          this.aadharVerified = true;
          this.confirmDialog.success('Aadhar Verified', 'Aadhar number is valid');
        } else {
          this.confirmDialog.error('Verification Failed', 'Unable to verify Aadhar number');
        }
      },
      error: () => {
        this.confirmDialog.warning('Verification Unavailable', 'Aadhar verification service is currently unavailable. You can proceed with registration.');
      }
    });
  }

  async checkDuplicate(): Promise<void> {
    const mobileNumber = this.registrationForm.get('mobileNumber')?.value;
    const aadharNumber = this.registrationForm.get('aadharNumber')?.value;

    if (!mobileNumber || !aadharNumber) return;

    this.checkingDuplicate = true;
    this.patientService.checkDuplicate(mobileNumber, aadharNumber).subscribe({
      next: async (result) => {
        this.checkingDuplicate = false;
        if (result.exists) {
          const viewExisting = await this.confirmDialog.confirm(
            'Patient Already Exists',
            `A patient with this mobile/Aadhar is already registered:\n\nName: ${result.patient?.firstName} ${result.patient?.lastName}\nReg. No: ${result.patient?.registrationNumber}\n\nDo you want to view this patient's details?`,
            'View Details',
            'Continue Anyway',
            'warning'
          );

          if (viewExisting && result.patient?.id) {
            this.router.navigate(['/patients/history', result.patient.id]);
          }
        }
      },
      error: () => {
        this.checkingDuplicate = false;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid) {
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
      this.confirmDialog.warning('Invalid Form', 'Please fill all required fields correctly');
      return;
    }

    const confirmed = await this.confirmDialog.confirm(
      'Register Patient',
      'Confirm registration with the provided details?',
      'Yes, Register',
      'Review Again',
      'question'
    );

    if (confirmed) {
      this.isSubmitting = true;

      const formValue = this.registrationForm.getRawValue();

      const formData = new FormData();

      Object.keys(formValue).forEach(key => {
        if (formValue[key] !== null && formValue[key] !== undefined) {
          formData.append(key, formValue[key]);
        }
      });

      // computed fields
      formData.append(
        'name',
        `${formValue.firstName} ${formValue.middleName || ''} ${formValue.lastName}`.trim()
      );

      // arrays → stringify
      formData.append('allergies', formValue.allergies || '');
      formData.append('chronicConditions', formValue.chronicConditions || '');
      formData.append('currentMedications', formValue.currentMedications || '');

      // files
      if (this.selectedPhotoFile) {
        formData.append('photoFile', this.selectedPhotoFile);
      }

      if (this.selectedAadharFile) {
        formData.append('aadharFile', this.selectedAadharFile);
      }

      this.patientService.registerPatient(formData).subscribe({
        next: (response: any) => {
          const patient = response.data;
          this.confirmDialog.success(
            'Registration Successful',
            `Patient registered successfully!\n\nReg. No: ${response.patientId}\nName: ${patient.firstName} ${patient.lastName}`
          );

          this.isSubmitting = false;

          // Ensure proper navigation to the token generation page
          this.router.navigateByUrl(`/patients/token/generate/${response.patientId}`);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.confirmDialog.error('Registration Failed', error.message || 'Failed to register patient');
        }
      });
    }
  }

  clearForm(): void {
    this.registrationForm.reset();
    this.photoPreview = null;
    this.selectedPhotoFile = null;
    this.selectedAadharFile = null;
    this.aadharVerified = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
