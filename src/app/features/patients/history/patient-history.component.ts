import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService, } from '../services/patient.service';
import { Patient } from '@app/common/models/patient.model';
import { LoaderComponent } from '@app/common';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.scss']
})
export class PatientHistoryComponent implements OnInit {
  patientId!: string;
  patient: Patient | null = null;
    patientHistory: any | null = null;
  isLoading: boolean = false;
  
  activeTab: string = 'overview';
  
  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.patientId) {
      this.loadPatientHistory();
    }
  }

  loadPatientHistory(): void {
    // this.isLoading = true;
    // this.patientService.getPatientHistory(this.patientId).subscribe({
    //   next: (history) => {
    //     this.patientHistory = history;
    //     this.patient = history.patient;
    //     this.isLoading = false;
    //   },
    //   error: () => {
    //     this.isLoading = false;
    //   }
    // });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getVisitStatusClass(status: string): string {
    switch(status) {
      case 'ACTIVE': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getVisitTypeClass(type: string): string {
    switch(type) {
      case 'OPD': return 'bg-info';
      case 'IPD': return 'bg-warning';
      case 'EMERGENCY': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  calculateBMI(weight: number, height: number): string {
    if (!weight || !height) return 'N/A';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  }

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBPStatus(systolic: number, diastolic: number): string {
    if (systolic < 120 && diastolic < 80) return 'Normal';
    if (systolic < 130 && diastolic < 80) return 'Elevated';
    if (systolic < 140 || diastolic < 90) return 'High (Stage 1)';
    return 'High (Stage 2)';
  }

  printHistory(): void {
    window.print();
  }

  exportPDF(): void {
    // Placeholder for PDF export
    console.log('Export to PDF - Feature to be implemented');
  }
}
