import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService, StockFilter } from '../services/inventory.service';
import { StockEntry } from '../models/inventory.model';
import { LoaderComponent } from '@app/common';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss']
})
export class StockListComponent implements OnInit {
  stocks: StockEntry[] = [];
  filteredStocks: StockEntry[] = [];
  isLoading: boolean = false;

  // Filters
  filters: StockFilter = {
    searchTerm: '',
    category: '',
    lowStock: false,
    expiringSoon: false,
    expired: false
  };

  // Categories (same as medicine model)
  categories: string[] = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 
    'Drop', 'Inhaler', 'Suspension', 'Cream', 'Powder', 'Other'
  ];

  // Stats
  totalMedicines: number = 0;
  lowStockCount: number = 0;
  expiringCount: number = 0;
  expiredCount: number = 0;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  loadStocks(): void {
    this.isLoading = true;
    this.inventoryService.getStocks(this.filters).subscribe({
      next: (data) => {
        this.stocks = data;
        this.filteredStocks = [...data];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stocks:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadStocks();
  }

  clearFilters(): void {
    this.filters = {
      searchTerm: '',
      category: '',
      lowStock: false,
      expiringSoon: false,
      expired: false
    };
    this.loadStocks();
  }

  calculateStats(): void {
    this.totalMedicines = this.stocks.length;
    this.lowStockCount = this.stocks.filter(s => s.currentStock <= s.reorderLevel).length;
    
    const today = new Date();
    const ninetyDaysFromNow = new Date(today);
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    this.expiringCount = this.stocks.filter(s => {
      const expiry = new Date(s.expiryDate);
      return expiry > today && expiry <= ninetyDaysFromNow;
    }).length;

    this.expiredCount = this.stocks.filter(s => new Date(s.expiryDate) <= today).length;
  }

  getStockStatusClass(stock: StockEntry): string {
    const today = new Date();
    const expiryDate = new Date(stock.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (expiryDate <= today) {
      return 'bg-danger';
    } else if (daysUntilExpiry <= 30) {
      return 'bg-danger';
    } else if (daysUntilExpiry <= 90) {
      return 'bg-warning';
    } else if (stock.currentStock <= stock.reorderLevel) {
      return 'bg-warning';
    }
    return 'bg-success';
  }

  getStockStatusText(stock: StockEntry): string {
    const today = new Date();
    const expiryDate = new Date(stock.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (expiryDate <= today) {
      return 'Expired';
    } else if (daysUntilExpiry <= 30) {
      return `Expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 90) {
      return `Expires in ${daysUntilExpiry} days`;
    } else if (stock.currentStock <= stock.reorderLevel) {
      return 'Low Stock';
    }
    return 'OK';
  }

  getStockLevelClass(stock: StockEntry): string {
    if (stock.currentStock === 0) return 'text-danger';
    if (stock.currentStock <= stock.reorderLevel) return 'text-warning';
    return 'text-success';
  }

  exportToExcel(): void {
    // Placeholder for Excel export
    console.log('Export to Excel - Feature to be implemented');
  }

  printStockReport(): void {
    window.print();
  }

  getTotalStockValue(): number {
    return this.filteredStocks.reduce((sum, s) => sum + (s.currentStock * s.unitPrice), 0);
  }
}
