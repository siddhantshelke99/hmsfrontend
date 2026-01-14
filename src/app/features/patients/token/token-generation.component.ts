import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { Patient } from '@app/common/models/patient.model';
import { PatientSearchComponent } from '@app/common/components/patient-search/patient-search.component';
import { PatientSearchService } from '@app/common/components/patient-search/patient-search.service';
import { ConfirmDialogComponent, LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-token-generation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent, PatientSearchComponent],
  templateUrl: './token-generation.component.html',
  styleUrls: ['./token-generation.component.scss']
})
export class TokenGenerationComponent implements OnInit {
  tokenForm!: FormGroup;
  isSubmitting: boolean = false;
  isLoadingQueue: boolean = false;
  selectedPatient: Patient | null = null;
  todaysTokens: any[] = [];
  filteredTokens: any[] = [];
  selectedDoctorTokens: number = 0;

  departments = [
    'General Medicine', 'Pediatrics', 'Gynecology', 'Orthopedics',
    'Cardiology', 'Dermatology', 'ENT', 'Ophthalmology', 'Dentistry',
    'Psychiatry', 'Surgery', 'Emergency'
  ];

  doctors = [
    { id: 'DOC001', name: 'Dr. Rajesh Kumar', department: 'General Medicine' },
    { id: 'DOC002', name: 'Dr. Priya Sharma', department: 'Pediatrics' },
    { id: 'DOC003', name: 'Dr. Amit Patel', department: 'Cardiology' },
    { id: 'DOC004', name: 'Dr. Sunita Reddy', department: 'Gynecology' },
    { id: 'DOC005', name: 'Dr. Vikram Singh', department: 'Orthopedics' },
    { id: 'DOC006', name: 'Dr. Meena Gupta', department: 'Dermatology' },
    { id: 'DOC007', name: 'Dr. Arun Kumar', department: 'ENT' },
    { id: 'DOC008', name: 'Dr. Kavita Joshi', department: 'Ophthalmology' }
  ];

  filteredDoctors = [...this.doctors];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private patientSearchService: PatientSearchService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadTodaysTokens();
  }

  initForm(): void {
    this.tokenForm = this.fb.group({
      patientId: ['', Validators.required],
      patientName: [{ value: '', disabled: true }],
      department: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: [{ value: '', disabled: true }],
      priority: ['NORMAL', Validators.required],
      remarks: ['']
    });

    // Filter doctors when department changes
    this.tokenForm.get('department')?.valueChanges.subscribe(dept => {
      if (dept) {
        this.filteredDoctors = this.doctors.filter(d => d.department === dept);
        this.tokenForm.patchValue({ doctorId: '', doctorName: '' });
      } else {
        this.filteredDoctors = [...this.doctors];
      }
      this.updateDoctorTokenCount();
    });

    // Update doctor name and token count when doctor changes
    this.tokenForm.get('doctorId')?.valueChanges.subscribe(doctorId => {
      const doctor = this.doctors.find(d => d.id === doctorId);
      if (doctor) {
        this.tokenForm.patchValue({ doctorName: doctor.name });
      }
      this.updateDoctorTokenCount();
    });
  }

  initializeForm(): void {
    this.tokenForm = this.fb.group({
      patientId: ['', Validators.required],
      department: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: [''],
    });
  }

  subscribeToPatientSelection(): void {
    this.patientSearchService.selectedPatient$.subscribe(patient => {
      if (patient) {
        this.selectedPatient = patient;
        this.tokenForm.patchValue({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`
        });
      }
    });
  }

  loadPatient(patientId: string): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (response: any) => {
        this.selectedPatient = response.data;
        this.tokenForm.patchValue({
          patientId: response.data.patientId,
          patientName: `${response.data.firstName} ${response.data.lastName}`
        });
      },
      error: () => {
        this.confirmDialog.error('Error', 'Failed to load patient details');
      }
    });
  }

  loadTodaysTokens(): void {
    this.isLoadingQueue = true;
    this.patientService.getTodaysTokens().subscribe(
      (tokens) => {
        this.todaysTokens = tokens;
        this.isLoadingQueue = false;
      },
      () => (this.isLoadingQueue = false)
    );
  }

  updateTokenStatus(tokenId: string, status: string): void {
    // Logic to update token status
    console.log(`Updating token ${tokenId} to status ${status}`);
  }

  printToken(token: any): void {
    const printContent = `
      <div>
        <h3>Hospital Name</h3>
        <p>Token Number: ${token.tokenNumber}</p>
        <p>Patient Name: ${token.patientName}</p>
        <p>Status: ${token.status}</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  updateDoctorTokenCount(): void {
    const doctorId = this.tokenForm.get('doctorId')?.value;
    if (doctorId) {
      this.selectedDoctorTokens = this.todaysTokens.filter(t => 
        t.doctorId === doctorId && t.status !== 'CANCELLED'
      ).length;
    } else {
      this.selectedDoctorTokens = 0;
    }
  }

  filterTokensByDepartment(department: string): void {
    if (department) {
      this.filteredTokens = this.todaysTokens.filter(t => t.department === department);
    } else {
      this.filteredTokens = [...this.todaysTokens];
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch(priority) {
      case 'EMERGENCY': return 'bg-danger';
      case 'URGENT': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'WAITING': return 'bg-info';
      case 'IN_PROGRESS': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  async onSubmit(): Promise<void> {
    if (this.tokenForm.invalid) {
      Object.keys(this.tokenForm.controls).forEach(key => {
        this.tokenForm.get(key)?.markAsTouched();
      });
      this.confirmDialog.warning('Invalid Form', 'Please fill all required fields');
      return;
    }

    const formValue = this.tokenForm.getRawValue();
    
    const confirmed = await this.confirmDialog.confirm(
      'Generate Token',
      `Generate OPD token for patient ${formValue.patientName}?\n\nDoctor: ${formValue.doctorName}\nDepartment: ${formValue.department}\nPriority: ${formValue.priority}`,
      'Yes, Generate',
      'Cancel',
      'question'
    );

    if (confirmed) {
      this.isSubmitting = true;

      const tokenData: Partial<any> = {
        patientId: formValue.patientId,
        patientName: formValue.patientName,
        doctorId: formValue.doctorId,
        doctorName: formValue.doctorName,
        department: formValue.department,
        priority: formValue.priority,
        remarks: formValue.remarks,
        tokenDate: new Date(),
        checkInTime: new Date(),
        status: 'WAITING',
        createdBy: 'CURRENT_USER' // Will be set by backend
      };

      this.patientService.generateToken(tokenData).subscribe({
        next: (token) => {
          this.confirmDialog.success(
            'Token Generated',
            `Token Number: ${token.tokenNumber}\n\nPatient: ${token.patientName}\nDoctor: ${token.doctorName}\nQueue Position: ${token.queuePosition}`
          );

          this.auditLog.logAction(
            AuditAction.CREATE,
            AuditModule.PATIENT,
            'TokenGeneration',
            token.id || '',
            `Generated token ${token.tokenNumber} for patient ${token.patientName} - Doctor: ${token.doctorName}`
          ).subscribe();

          this.isSubmitting = false;
          this.loadTodaysTokens(); // Refresh the side list
          this.clearForm();
          this.printToken(token);
          // Optional: Print token
          setTimeout(() => {
            this.printToken(token);
          }, 1000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.confirmDialog.error('Error', error.message || 'Failed to generate token');
        }
      });
    }
  }

  clearForm(): void {
    this.tokenForm.reset({ priority: 'NORMAL' });
    this.selectedPatient = null;
    this.patientSearchService.clearSelection();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tokenForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
