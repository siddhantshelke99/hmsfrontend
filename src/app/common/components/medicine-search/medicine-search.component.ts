import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Medicine, MedicineStock, MedicineSearchCriteria, MedicineCategory } from '../../models/medicine.model';
import { MedicineSearchService } from './medicine-search.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-medicine-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-search.component.html',
  styleUrls: ['./medicine-search.component.scss']
})
export class MedicineSearchComponent {
  @Input() placeholder: string = 'Search medicine by name or generic name';
  @Input() showAdvancedSearch: boolean = true;
  @Input() showStockInfo: boolean = true;
  @Output() medicineSelected = new EventEmitter<Medicine>();
  @Output() stockSelected = new EventEmitter<MedicineStock>();

  searchTerm: string = '';
  isSearching: boolean = false;
  showDropdown: boolean = false;
  medicines: Medicine[] = [];
  medicineStocks: MedicineStock[] = [];
  selectedMedicine: Medicine | null = null;

  // Advanced search
  showAdvanced: boolean = false;
  advancedCriteria: MedicineSearchCriteria = {};
  categories = Object.values(MedicineCategory);

  private searchSubject = new Subject<string>();

  constructor(private medicineSearchService: MedicineSearchService) {
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
          return this.medicineSearchService.searchMedicines(term).pipe(
            catchError(() => {
              this.isSearching = false;
              return of([]);
            })
          );
        })
      )
      .subscribe((medicines) => {
        this.medicines = medicines;
        this.isSearching = false;
        this.showDropdown = medicines.length > 0;
      });
  }

  onSearchInput(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  selectMedicine(medicine: Medicine): void {
    this.selectedMedicine = medicine;
    this.searchTerm = `${medicine.name} (${medicine.genericName})`;
    this.showDropdown = false;
    this.medicineSearchService.setSelectedMedicine(medicine);
    this.medicineSelected.emit(medicine);

    // Load stock info if enabled
    if (this.showStockInfo && medicine.id) {
      this.loadStockInfo(medicine.id);
    }
  }

  loadStockInfo(medicineId: string): void {
    this.medicineSearchService
      .getMedicineStock(medicineId)
      .subscribe({
        next: (stocks) => {
          this.medicineStocks = stocks;
        },
        error: () => {
          this.medicineStocks = [];
        }
      });
  }

  selectStock(stock: MedicineStock): void {
    this.medicineSearchService.setSelectedStock(stock);
    this.stockSelected.emit(stock);
  }

  clearSelection(): void {
    this.selectedMedicine = null;
    this.searchTerm = '';
    this.medicines = [];
    this.medicineStocks = [];
    this.showDropdown = false;
    this.medicineSearchService.clearSelection();
  }

  toggleAdvancedSearch(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  searchAdvanced(): void {
    this.isSearching = true;
    this.medicineSearchService
      .advancedSearch(this.advancedCriteria)
      .subscribe({
        next: (medicines) => {
          this.medicines = medicines;
          this.isSearching = false;
          this.showDropdown = medicines.length > 0;
        },
        error: () => {
          this.isSearching = false;
        }
      });
  }

  resetAdvancedSearch(): void {
    this.advancedCriteria = {};
    this.medicines = [];
    this.showDropdown = false;
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  isExpiringSoon(expiryDate: Date): boolean {
    return this.medicineSearchService.isExpiringSoon(expiryDate);
  }

  isExpired(expiryDate: Date): boolean {
    return this.medicineSearchService.isExpired(expiryDate);
  }
}
