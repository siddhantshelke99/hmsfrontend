import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { InventoryService } from '../services/inventory.service';
import { InwardEntry, InwardItem, Supplier } from '../models/inventory.model';
import { MedicineSearchComponent, ConfirmDialogComponent } from '@app/common';
import { Medicine } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-inward-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MedicineSearchComponent],
  templateUrl: './inward-create.component.html',
  styleUrls: ['./inward-create.component.scss']
})
export class InwardCreateComponent implements OnInit {
  inwardForm!: FormGroup;
  suppliers: Supplier[] = [];
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
  }

  initForm(): void {
    this.inwardForm = this.fb.group({
      entryNumber: ['', Validators.required],
      entryDate: [new Date().toISOString().split('T')[0], Validators.required],
      supplierId: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      invoiceAmount: [0, [Validators.required, Validators.min(0)]],
      challanNumber: [''],
      purchaseOrderNumber: [''],
      remarks: [''],
      items: this.fb.array([])
    });

    // Add first item by default
    this.addItem();
  }

  get items(): FormArray {
    return this.inwardForm.get('items') as FormArray;
  }

  createItemForm(): FormGroup {
    return this.fb.group({
      medicineId: ['', Validators.required],
      medicineName: ['', Validators.required],
      genericName: [''],
      batchNumber: ['', Validators.required],
      manufacturingDate: ['', Validators.required],
      expiryDate: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      freeQuantity: [0, Validators.min(0)],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      mrp: [0, [Validators.required, Validators.min(0)]],
      gstRate: [12, Validators.required],
      discountPercent: [0, Validators.min(0)],
      totalAmount: [{ value: 0, disabled: true }],
      location: ['', Validators.required],
      rack: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotal();
    }
  }

  onMedicineSelected(medicine: Medicine, index: number): void {
    const item = this.items.at(index);
    item.patchValue({
      medicineId: medicine.id,
      medicineName: medicine.name,
      genericName: medicine.genericName
    });
  }

  calculateItemTotal(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const freeQty = item.get('freeQuantity')?.value || 0;
    const purchasePrice = item.get('purchasePrice')?.value || 0;
    const gstRate = item.get('gstRate')?.value || 0;
    const discount = item.get('discountPercent')?.value || 0;

    const baseAmount = quantity * purchasePrice;
    const discountAmount = (baseAmount * discount) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const total = taxableAmount + gstAmount;

    item.patchValue({ totalAmount: total }, { emitEvent: false });
    this.calculateTotal();
  }

  calculateTotal(): void {
    const total = this.items.controls.reduce((sum, item) => {
      return sum + (item.get('totalAmount')?.value || 0);
    }, 0);
    
    this.inwardForm.patchValue({ invoiceAmount: total }, { emitEvent: false });
  }

  loadSuppliers(): void {
    this.inventoryService.getActiveSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.inwardForm.invalid) {
      this.confirmDialog.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    const confirmed = await this.confirmDialog.confirm(
      'Create Inward Entry',
      'Create new inward entry with ' + this.items.length + ' items?',
      'Yes, Create',
      'Cancel',
      'question'
    );

    if (confirmed) {
      this.isSubmitting = true;
      
      const formValue = this.inwardForm.getRawValue();
      const entry: InwardEntry = {
        ...formValue,
        status: 'PENDING',
        createdBy: 'CURRENT_USER', // TODO: Get from AuthService
        createdAt: new Date()
      };

      this.inventoryService.createInwardEntry(entry).subscribe({
        next: (result) => {
          this.confirmDialog.success('Success', 'Inward entry created successfully');
          
          this.auditLog.logAction(
            AuditAction.CREATE,
            AuditModule.INVENTORY,
            'InwardEntry',
            result.id!,
            `Created inward entry ${result.entryNumber} with ${result.items.length} items`
          ).subscribe();

          this.router.navigate(['/inventory/inward']);
        },
        error: (error) => {
          this.confirmDialog.error('Error', 'Failed to create inward entry');
          this.isSubmitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory/inward']);
  }
}
