import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import { OutsourcedMedicine, OutsourcedStatus } from '../models/inventory.model';
import { ConfirmDialogComponent, LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-outsourced-medicine-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
  templateUrl: './outsourced-medicine-list.component.html',
  styleUrls: ['./outsourced-medicine-list.component.scss']
})
export class OutsourcedMedicineListComponent implements OnInit {
  outsourcedMedicines: OutsourcedMedicine[] = [];
  filteredMedicines: OutsourcedMedicine[] = [];
  isLoading: boolean = false;

  // Filters
  searchTerm: string = '';
  statusFilter: string = '';
  dateFilter: string = '';

  // Stats
  totalRequests: number = 0;
  pendingCount: number = 0;
  fulfilledCount: number = 0;
  cancelledCount: number = 0;

  OutsourcedStatus = OutsourcedStatus;

  constructor(
    private inventoryService: InventoryService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService
  ) {}

  ngOnInit(): void {
    this.loadOutsourcedMedicines();
  }

  loadOutsourcedMedicines(): void {
    this.isLoading = true;
    this.inventoryService.getOutsourcedMedicines().subscribe({
      next: (data) => {
        this.outsourcedMedicines = data;
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading outsourced medicines:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredMedicines = this.outsourcedMedicines.filter(medicine => {
      const matchesSearch = !this.searchTerm || 
        medicine.medicineName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        medicine.patientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        medicine.prescriptionNumber.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter || medicine.status === this.statusFilter;

      let matchesDate = true;
      if (this.dateFilter) {
        const filterDate = new Date(this.dateFilter).toDateString();
        const medicineDate = new Date(medicine.requestDate).toDateString();
        matchesDate = filterDate === medicineDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.applyFilters();
  }

  calculateStats(): void {
    this.totalRequests = this.outsourcedMedicines.length;
    this.pendingCount = this.outsourcedMedicines.filter(m => m.status === OutsourcedStatus.PENDING).length;
    this.fulfilledCount = this.outsourcedMedicines.filter(m => m.status === OutsourcedStatus.FULFILLED).length;
    this.cancelledCount = this.outsourcedMedicines.filter(m => m.status === OutsourcedStatus.CANCELLED).length;
  }

  getStatusBadgeClass(status: OutsourcedStatus): string {
    switch(status) {
      case OutsourcedStatus.PENDING:
        return 'bg-warning';
      case OutsourcedStatus.ARRANGED:
        return 'bg-info';
      case OutsourcedStatus.FULFILLED:
        return 'bg-success';
      case OutsourcedStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  async markAsArranged(medicine: OutsourcedMedicine): Promise<void> {
    const result = await this.confirmDialog.prompt(
      'Mark as Arranged',
      'Enter pharmacy/supplier name where medicine is arranged:',
      'Pharmacy Name',
      'Confirm',
      'Cancel'
    );

    if (result.isConfirmed && result.value) {
      medicine.status = OutsourcedStatus.ARRANGED;
      medicine.arrangedBy = 'CURRENT_USER';
      medicine.arrangedDate = new Date().toISOString();
      medicine.remarks = (medicine.remarks || '') + `\nArranged from: ${result.value}`;

      this.inventoryService.updateOutsourcedMedicine(medicine).subscribe({
        next: () => {
          this.confirmDialog.success('Success', 'Medicine marked as arranged');
          this.auditLog.logAction(
            AuditAction.UPDATE,
            AuditModule.INVENTORY,
            'OutsourcedMedicine',
            medicine.id,
            `Marked as arranged: ${medicine.medicineName} from ${result.value}`
          ).subscribe();
          this.loadOutsourcedMedicines();
        },
        error: () => {
          this.confirmDialog.error('Error', 'Failed to update status');
        }
      });
    }
  }

  async markAsFulfilled(medicine: OutsourcedMedicine): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      'Mark as Fulfilled',
      `Confirm that ${medicine.medicineName} has been provided to patient ${medicine.patientName}?`,
      'Yes, Fulfilled',
      'Cancel',
      'success'
    );

    if (confirmed) {
      medicine.status = OutsourcedStatus.FULFILLED;
      medicine.fulfilledDate = new Date().toISOString();

      this.inventoryService.updateOutsourcedMedicine(medicine).subscribe({
        next: () => {
          this.confirmDialog.success('Success', 'Medicine marked as fulfilled');
          this.auditLog.logAction(
            AuditAction.UPDATE,
            AuditModule.INVENTORY,
            'OutsourcedMedicine',
            medicine.id,
            `Marked as fulfilled: ${medicine.medicineName} for patient ${medicine.patientName}`
          ).subscribe();
          this.loadOutsourcedMedicines();
        },
        error: () => {
          this.confirmDialog.error('Error', 'Failed to update status');
        }
      });
    }
  }

  async cancelRequest(medicine: OutsourcedMedicine): Promise<void> {
    const result = await this.confirmDialog.prompt(
      'Cancel Request',
      'Enter reason for cancellation:',
      'Cancellation Reason',
      'Cancel Request',
      'Go Back'
    );

    if (result.isConfirmed && result.value) {
      medicine.status = OutsourcedStatus.CANCELLED;
      medicine.remarks = (medicine.remarks || '') + `\nCancelled: ${result.value}`;

      this.inventoryService.updateOutsourcedMedicine(medicine).subscribe({
        next: () => {
          this.confirmDialog.success('Success', 'Request cancelled');
          this.auditLog.logAction(
            AuditAction.DELETE,
            AuditModule.INVENTORY,
            'OutsourcedMedicine',
            medicine.id,
            `Cancelled outsourced request: ${medicine.medicineName}. Reason: ${result.value}`
          ).subscribe();
          this.loadOutsourcedMedicines();
        },
        error: () => {
          this.confirmDialog.error('Error', 'Failed to cancel request');
        }
      });
    }
  }

  viewDetails(medicine: OutsourcedMedicine): void {
    const details = `
      <div class="text-start">
        <p><strong>Medicine:</strong> ${medicine.medicineName}</p>
        <p><strong>Quantity:</strong> ${medicine.quantity}</p>
        <p><strong>Patient:</strong> ${medicine.patientName} (${medicine.patientId})</p>
        <p><strong>Prescription:</strong> ${medicine.prescriptionNumber}</p>
        <p><strong>Requested Date:</strong> ${new Date(medicine.requestDate).toLocaleString()}</p>
        <p><strong>Requested By:</strong> ${medicine.requestedBy}</p>
        ${medicine.arrangedDate ? `<p><strong>Arranged Date:</strong> ${new Date(medicine.arrangedDate).toLocaleString()}</p>` : ''}
        ${medicine.arrangedBy ? `<p><strong>Arranged By:</strong> ${medicine.arrangedBy}</p>` : ''}
        ${medicine.fulfilledDate ? `<p><strong>Fulfilled Date:</strong> ${new Date(medicine.fulfilledDate).toLocaleString()}</p>` : ''}
        ${medicine.estimatedCost ? `<p><strong>Estimated Cost:</strong> ₹${medicine.estimatedCost}</p>` : ''}
        ${medicine.actualCost ? `<p><strong>Actual Cost:</strong> ₹${medicine.actualCost}</p>` : ''}
        ${medicine.remarks ? `<p><strong>Remarks:</strong><br>${medicine.remarks.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    `;

    this.confirmDialog.info('Outsourced Medicine Details', details);
  }

  exportToExcel(): void {
    console.log('Export to Excel - Feature to be implemented');
  }
}
