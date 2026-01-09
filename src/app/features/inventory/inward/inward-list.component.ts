import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../services/inventory.service';
import { InwardEntry, InwardFilter } from '../models/inventory.model';
import { LoaderComponent, ConfirmDialogComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-inward-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoaderComponent],
  templateUrl: './inward-list.component.html',
  styleUrls: ['./inward-list.component.scss']
})
export class InwardListComponent implements OnInit {
  inwardEntries: InwardEntry[] = [];
  filteredEntries: InwardEntry[] = [];
  isLoading: boolean = true;
  
  filter: InwardFilter = {};
  searchTerm: string = '';
  selectedStatus: string = '';

  constructor(
    private inventoryService: InventoryService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService
  ) {}

  ngOnInit(): void {
    this.loadInwardEntries();
  }

  loadInwardEntries(): void {
    this.isLoading = true;
    this.inventoryService.getInwardEntries(this.filter)
      .subscribe({
        next: (entries) => {
          this.inwardEntries = entries;
          this.filteredEntries = entries;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading inward entries:', error);
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredEntries = this.inwardEntries.filter(entry => {
      const matchesSearch = !this.searchTerm || 
        entry.entryNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        entry.supplierName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        entry.invoiceNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || entry.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  async verifyEntry(entry: InwardEntry): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      'Verify Inward Entry',
      `Verify inward entry ${entry.entryNumber}?`,
      'Yes, Verify',
      'Cancel',
      'question'
    );

    if (confirmed) {
      this.inventoryService.verifyInwardEntry(entry.id!)
        .subscribe({
          next: () => {
            this.confirmDialog.success('Verified', 'Inward entry verified successfully');
            this.loadInwardEntries();
            
            this.auditLog.logAction(
              AuditAction.APPROVE,
              AuditModule.INVENTORY,
              'InwardEntry',
              entry.id!,
              `Verified inward entry ${entry.entryNumber}`
            ).subscribe();
          },
          error: () => {
            this.confirmDialog.error('Error', 'Failed to verify inward entry');
          }
        });
    }
  }

  async approveEntry(entry: InwardEntry): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      'Approve Inward Entry',
      `Approve inward entry ${entry.entryNumber}? Stock will be added.`,
      'Yes, Approve',
      'Cancel',
      'question'
    );

    if (confirmed) {
      this.inventoryService.approveInwardEntry(entry.id!)
        .subscribe({
          next: () => {
            this.confirmDialog.success('Approved', 'Inward entry approved and stock updated');
            this.loadInwardEntries();
            
            this.auditLog.logAction(
              AuditAction.APPROVE,
              AuditModule.INVENTORY,
              'InwardEntry',
              entry.id!,
              `Approved inward entry ${entry.entryNumber}`
            ).subscribe();
          },
          error: () => {
            this.confirmDialog.error('Error', 'Failed to approve inward entry');
          }
        });
    }
  }

  async rejectEntry(entry: InwardEntry): Promise<void> {
    const confirmed = await this.confirmDialog.confirmDelete(
      'Reject Inward Entry',
      `Reject inward entry ${entry.entryNumber}? This action cannot be undone.`,
      'Yes, Reject',
      'Cancel'
    );

    if (confirmed) {
      // TODO: Show reason dialog
      const reason = 'Rejected by admin'; // Get from user input
      
      this.inventoryService.rejectInwardEntry(entry.id!, reason)
        .subscribe({
          next: () => {
            this.confirmDialog.success('Rejected', 'Inward entry rejected');
            this.loadInwardEntries();
            
            this.auditLog.logAction(
              AuditAction.REJECT,
              AuditModule.INVENTORY,
              'InwardEntry',
              entry.id!,
              `Rejected inward entry ${entry.entryNumber}: ${reason}`
            ).subscribe();
          },
          error: () => {
            this.confirmDialog.error('Error', 'Failed to reject inward entry');
          }
        });
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'VERIFIED': return 'bg-info';
      case 'APPROVED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getTotalAmount(entry: InwardEntry): number {
    return entry.items.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.filter = {};
    this.loadInwardEntries();
  }
}
