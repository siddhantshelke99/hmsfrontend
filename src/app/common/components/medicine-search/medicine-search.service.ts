import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Medicine, MedicineStock, MedicineSearchCriteria } from '../../models/medicine.model';
import { ApiService } from '../../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class MedicineSearchService {
  private selectedMedicineSubject = new BehaviorSubject<Medicine | null>(null);
  public selectedMedicine$: Observable<Medicine | null> = this.selectedMedicineSubject.asObservable();

  private selectedStockSubject = new BehaviorSubject<MedicineStock | null>(null);
  public selectedStock$: Observable<MedicineStock | null> = this.selectedStockSubject.asObservable();

  // Alias for selectedStock$ for compatibility
  public selectedBatch$: Observable<MedicineStock | null> = this.selectedStockSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Search medicines by query string
   */
  searchMedicines(query: string): Observable<Medicine[]> {
    return this.apiService.get<Medicine[]>('/medicines/search', { q: query });
  }

  /**
   * Advanced search with multiple criteria
   */
  advancedSearch(criteria: MedicineSearchCriteria): Observable<Medicine[]> {
    return this.apiService.post<Medicine[]>('/medicines/advanced-search', criteria);
  }

  /**
   * Get medicine by ID
   */
  getMedicineById(id: string): Observable<Medicine> {
    return this.apiService.get<Medicine>(`/medicines/${id}`);
  }

  /**
   * Get stock information for a medicine
   */
  getMedicineStock(medicineId: string): Observable<MedicineStock[]> {
    return this.apiService.get<MedicineStock[]>(`/medicines/${medicineId}/stock`);
  }

  /**
   * Get available stock only (non-expired, quantity > 0)
   */
  getAvailableStock(medicineId: string): Observable<MedicineStock[]> {
    return this.apiService.get<MedicineStock[]>(`/medicines/${medicineId}/stock/available`);
  }

  /**
   * Get expiring medicines (within 90 days)
   */
  getExpiringMedicines(): Observable<MedicineStock[]> {
    return this.apiService.get<MedicineStock[]>('/medicines/stock/expiring');
  }

  /**
   * Get expired medicines
   */
  getExpiredMedicines(): Observable<MedicineStock[]> {
    return this.apiService.get<MedicineStock[]>('/medicines/stock/expired');
  }

  /**
   * Get low stock medicines
   */
  getLowStockMedicines(): Observable<Medicine[]> {
    return this.apiService.get<Medicine[]>('/medicines/low-stock');
  }

  /**
   * Set selected medicine
   */
  setSelectedMedicine(medicine: Medicine | null): void {
    this.selectedMedicineSubject.next(medicine);
  }

  /**
   * Get current selected medicine
   */
  getSelectedMedicine(): Medicine | null {
    return this.selectedMedicineSubject.value;
  }

  /**
   * Set selected stock
   */
  setSelectedStock(stock: MedicineStock | null): void {
    this.selectedStockSubject.next(stock);
  }

  /**
   * Get current selected stock
   */
  getSelectedStock(): MedicineStock | null {
    return this.selectedStockSubject.value;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedMedicineSubject.next(null);
    this.selectedStockSubject.next(null);
  }

  /**
   * Check if medicine is narcotic
   */
  isNarcotic(medicineId: string): Observable<boolean> {
    return this.apiService.get<boolean>(`/medicines/${medicineId}/narcotic`);
  }

  /**
   * Get medicine alternatives (same generic name)
   */
  getMedicineAlternatives(medicineId: string): Observable<Medicine[]> {
    return this.apiService.get<Medicine[]>(`/medicines/${medicineId}/alternatives`);
  }

  /**
   * Check expiry status
   */
  isExpiringSoon(expiryDate: Date): boolean {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  }

  /**
   * Check if expired
   */
  isExpired(expiryDate: Date): boolean {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  }
}
