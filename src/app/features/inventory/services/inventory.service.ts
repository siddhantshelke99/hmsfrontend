import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/common';
import {
  InwardEntry,
  StockEntry,
  StockAdjustment,
  OutsourcedMedicine,
  Supplier,
  StockFilter,
  InwardFilter,
  StockReport
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private apiService: ApiService) {}

  // ============================================
  // INWARD MANAGEMENT
  // ============================================

  /**
   * Get all inward entries
   */
  getInwardEntries(filter?: InwardFilter): Observable<InwardEntry[]> {
    return this.apiService.get<InwardEntry[]>('/inventory/inward', filter);
  }

  /**
   * Get inward entry by ID
   */
  getInwardEntryById(id: string): Observable<InwardEntry> {
    return this.apiService.get<InwardEntry>(`/inventory/inward/${id}`);
  }

  /**
   * Create new inward entry
   */
  createInwardEntry(entry: InwardEntry): Observable<InwardEntry> {
    return this.apiService.post<InwardEntry>('/inventory/inward', entry);
  }

  /**
   * Update inward entry
   */
  updateInwardEntry(id: string, entry: InwardEntry): Observable<InwardEntry> {
    return this.apiService.put<InwardEntry>(`/inventory/inward/${id}`, entry);
  }

  /**
   * Verify inward entry
   */
  verifyInwardEntry(id: string): Observable<void> {
    return this.apiService.post<void>(`/inventory/inward/${id}/verify`, {});
  }

  /**
   * Approve inward entry
   */
  approveInwardEntry(id: string, remarks?: string): Observable<void> {
    return this.apiService.post<void>(`/inventory/inward/${id}/approve`, { remarks });
  }

  /**
   * Reject inward entry
   */
  rejectInwardEntry(id: string, reason: string): Observable<void> {
    return this.apiService.post<void>(`/inventory/inward/${id}/reject`, { reason });
  }

  /**
   * Upload invoice (OCR)
   */
  uploadInvoice(file: File): Observable<any> {
    return this.apiService.uploadFile<any>('/inventory/inward/upload-invoice', file);
  }

  // ============================================
  // STOCK MANAGEMENT
  // ============================================

  /**
   * Get all stock entries (alias for getStockEntries)
   */
  getStocks(filter?: StockFilter): Observable<StockEntry[]> {
    return this.getStockEntries(filter);
  }

  /**
   * Get all stock entries
   */
  getStockEntries(filter?: StockFilter): Observable<StockEntry[]> {
    return this.apiService.get<StockEntry[]>('/inventory/stock', filter);
  }

  /**
   * Get stock by medicine ID
   */
  getStockByMedicineId(medicineId: string): Observable<StockEntry[]> {
    return this.apiService.get<StockEntry[]>(`/inventory/stock/medicine/${medicineId}`);
  }

  /**
   * Get stock by batch number
   */
  getStockByBatch(batchNumber: string): Observable<StockEntry> {
    return this.apiService.get<StockEntry>(`/inventory/stock/batch/${batchNumber}`);
  }

  /**
   * Get low stock medicines
   */
  getLowStockMedicines(): Observable<StockEntry[]> {
    return this.apiService.get<StockEntry[]>('/inventory/stock/low-stock');
  }

  /**
   * Get expiring medicines
   */
  getExpiringMedicines(days: number = 90): Observable<StockEntry[]> {
    return this.apiService.get<StockEntry[]>(`/inventory/stock/expiring?days=${days}`);
  }

  /**
   * Get expired medicines
   */
  getExpiredMedicines(): Observable<StockEntry[]> {
    return this.apiService.get<StockEntry[]>('/inventory/stock/expired');
  }

  /**
   * Get stock report
   */
  getStockReport(): Observable<StockReport[]> {
    return this.apiService.get<StockReport[]>('/inventory/stock/report');
  }

  // ============================================
  // STOCK ADJUSTMENTS
  // ============================================

  /**
   * Get all stock adjustments
   */
  getStockAdjustments(): Observable<StockAdjustment[]> {
    return this.apiService.get<StockAdjustment[]>('/inventory/adjustments');
  }

  /**
   * Create stock adjustment
   */
  createStockAdjustment(adjustment: StockAdjustment): Observable<StockAdjustment> {
    return this.apiService.post<StockAdjustment>('/inventory/adjustments', adjustment);
  }

  /**
   * Approve stock adjustment
   */
  approveStockAdjustment(id: string): Observable<void> {
    return this.apiService.post<void>(`/inventory/adjustments/${id}/approve`, {});
  }

  /**
   * Reject stock adjustment
   */
  rejectStockAdjustment(id: string, reason: string): Observable<void> {
    return this.apiService.post<void>(`/inventory/adjustments/${id}/reject`, { reason });
  }

  // ============================================
  // OUTSOURCED MEDICINES
  // ============================================

  /**
   * Get all outsourced medicines
   */
  getOutsourcedMedicines(): Observable<OutsourcedMedicine[]> {
    return this.apiService.get<OutsourcedMedicine[]>('/inventory/outsourced');
  }

  /**
   * Create outsourced medicine entry
   */
  createOutsourcedMedicine(medicine: OutsourcedMedicine): Observable<OutsourcedMedicine> {
    return this.apiService.post<OutsourcedMedicine>('/inventory/outsourced', medicine);
  }

  /**
   * Update outsourced medicine
   */
  updateOutsourcedMedicine(medicine: OutsourcedMedicine): Observable<OutsourcedMedicine> {
    return this.apiService.put<OutsourcedMedicine>(`/inventory/outsourced/${medicine.id}`, medicine);
  }

  /**
   * Update outsourced medicine status
   */
  updateOutsourcedStatus(id: string, status: string, actualCost?: number): Observable<void> {
    return this.apiService.put<void>(`/inventory/outsourced/${id}/status`, { status, actualCost });
  }

  // ============================================
  // SUPPLIERS
  // ============================================

  /**
   * Get all suppliers
   */
  getSuppliers(): Observable<Supplier[]> {
    return this.apiService.get<Supplier[]>('/inventory/suppliers');
  }

  /**
   * Get active suppliers
   */
  getActiveSuppliers(): Observable<Supplier[]> {
    return this.apiService.get<Supplier[]>('/inventory/suppliers?status=ACTIVE');
  }

  /**
   * Create supplier
   */
  createSupplier(supplier: Supplier): Observable<Supplier> {
    return this.apiService.post<Supplier>('/inventory/suppliers', supplier);
  }

  /**
   * Update supplier
   */
  updateSupplier(id: string, supplier: Supplier): Observable<Supplier> {
    return this.apiService.put<Supplier>(`/inventory/suppliers/${id}`, supplier);
  }
}
export { StockFilter };

