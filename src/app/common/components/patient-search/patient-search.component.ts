import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient, PatientSearchCriteria } from '../../models/patient.model';
import { PatientSearchService } from './patient-search.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search.component.html',
  styleUrls: ['./patient-search.component.scss']
})
export class PatientSearchComponent {
  @Input() placeholder: string = 'Search by Registration No, Name, or Contact';
  @Input() showAdvancedSearch: boolean = true;
  @Output() patientSelected = new EventEmitter<Patient>();

  searchTerm: string = '';
  isSearching: boolean = false;
  showDropdown: boolean = false;
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;

  // Advanced search
  showAdvanced: boolean = false;
  advancedCriteria: PatientSearchCriteria = {};

  private searchSubject = new Subject<string>();

  constructor(private patientSearchService: PatientSearchService) {
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 2) {
            return of([]);
          }
          this.isSearching = true;
          return this.patientSearchService.searchPatients(term).pipe(
            catchError(() => {
              this.isSearching = false;
              return of([]);
            })
          );
        })
      )
      .subscribe((res:any) => {
        this.patients = res.data || [];
        this.isSearching = false;
        this.showDropdown = this.patients.length > 0;
      });
  }

  onSearchInput(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.searchTerm = `${patient.registrationNumber} - ${patient.firstName} ${patient.lastName}`;
    this.showDropdown = false;
    this.patientSearchService.setSelectedPatient(patient);
    this.patientSelected.emit(patient);
  }

  clearSelection(): void {
    this.selectedPatient = null;
    this.searchTerm = '';
    this.patients = [];
    this.showDropdown = false;
    this.patientSearchService.clearSelection();
  }

  toggleAdvancedSearch(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  searchAdvanced(): void {
    this.isSearching = true;
    this.patientSearchService
      .advancedSearch(this.advancedCriteria)
      .subscribe({
        next: (res:any) => {
          this.patients = res.data || [];
          this.isSearching = false;
          this.showDropdown = this.patients.length > 0;
        },
        error: () => {
          this.isSearching = false;
        }
      });
  }

  resetAdvancedSearch(): void {
    this.advancedCriteria = {};
    this.patients = [];
    this.showDropdown = false;
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
}
