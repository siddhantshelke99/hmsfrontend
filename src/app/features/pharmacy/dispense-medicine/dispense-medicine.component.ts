import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { LoaderComponent } from '@app/common';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PharmacyService } from '../services/pharmacy.service';
import { PrescriptionService } from '../../prescriptions/services/prescription.service';
import { Prescription } from '../../prescriptions/models/prescription.model';
import {
  DispensingItem,
  MedicineDispense,
  DispensingType,
  PaymentStatus,
  PaymentMethod,
  BatchSelection,
  ItemDispensingStatus
} from '../models/pharmacy.model';

@Component({
  selector: 'app-dispense-medicine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent],
  templateUrl: './dispense-medicine.component.html',
  styleUrls: ['./dispense-medicine.component.scss']
})
export class DispenseMedicineComponent implements OnInit, OnDestroy {
  prescription: Prescription | null = null;
  dispensingForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  prescriptionId!: string;

  paymentStatuses = Object.values(PaymentStatus);
  paymentMethods = Object.values(PaymentMethod);
  
  availableBatches: Map<string, BatchSelection[]> = new Map();
  substituteOptions: Map<string, any[]> = new Map();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pharmacyService: PharmacyService,
    private prescriptionService: PrescriptionService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.prescriptionId = this.route.snapshot.paramMap.get('prescriptionId') || '';
    
    if (this.prescriptionId) {
      this.loadPrescription();
    } else {
      this.notificationService.error('Invalid ID', 'Invalid prescription ID');
      this.router.navigate(['/pharmacy/queue']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.dispensingForm = this.fb.group({
      items: this.fb.array([]),
      paymentStatus: [PaymentStatus.FREE, Validators.required],
      paymentMethod: [PaymentMethod.FREE],
      paymentReference: [''],
      remarks: ['']
    });

    // Update payment method required when status is PAID
    this.dispensingForm.get('paymentStatus')?.valueChanges.subscribe(status => {
      const paymentMethodControl = this.dispensingForm.get('paymentMethod');
      if (status === PaymentStatus.PAID) {
        paymentMethodControl?.setValidators(Validators.required);
      } else {
        paymentMethodControl?.clearValidators();
      }
      paymentMethodControl?.updateValueAndValidity();
    });
  }

  get items(): FormArray {
    return this.dispensingForm.get('items') as FormArray;
  }

  loadPrescription(): void {
    this.isLoading = true;
    
    this.prescriptionService.getPrescriptionById(this.prescriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescription) => {
          this.prescription = prescription;
          this.initializeDispensingItems();
          this.isLoading = false;
          this.logAudit(
            AuditAction.VIEW,
            `Loaded prescription ${prescription.prescriptionNumber} for dispensing`
          );
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to load prescription: ' + error.message);
          this.isLoading = false;
          this.router.navigate(['/pharmacy/queue']);
        }
      });
  }

  private initializeDispensingItems(): void {
    if (!this.prescription) return;

    this.items.clear();
    
    this.prescription.items.forEach(prescribedItem => {
      const itemGroup = this.fb.group({
        prescriptionItemId: [prescribedItem.id],
        medicineId: [prescribedItem.medicineId, Validators.required],
        medicineName: [prescribedItem.medicineName],
        medicineType: [prescribedItem.medicineType],
        strength: [prescribedItem.strength],
        prescribedQuantity: [prescribedItem.totalQuantity],
        dispensedQuantity: [prescribedItem.totalQuantity, [Validators.required, Validators.min(0)]],
        availableStock: [0],
        selectedBatchId: ['', Validators.required],
        selectedBatchNumber: [''],
        selectedBatchExpiry: [''],
        unitPrice: [0],
        totalPrice: [{ value: 0, disabled: true }],
        substituted: [false],
        substituteMedicineId: [''],
        substituteMedicineName: [''],
        substituteReason: [''],
        status: [ItemDispensingStatus.PENDING],
        remarks: ['']
      });

      // Load available batches for this medicine
      this.loadBatches(prescribedItem.medicineId, prescribedItem.totalQuantity);

      // Update total price when quantity or unit price changes
      itemGroup.get('dispensedQuantity')?.valueChanges.subscribe(() => this.updateItemPrice(itemGroup));
      itemGroup.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemPrice(itemGroup));

      this.items.push(itemGroup);
    });
  }

  private loadBatches(medicineId: string, requiredQuantity: number): void {
    this.pharmacyService.getAvailableBatches(medicineId, requiredQuantity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.availableBatches.set(medicineId, batches);
          
          // Update available stock in the form
          const itemIndex = this.items.controls.findIndex(
            item => item.get('medicineId')?.value === medicineId
          );
          if (itemIndex !== -1) {
            const totalStock = batches.reduce((sum, batch) => sum + batch.availableQuantity, 0);
            this.items.at(itemIndex).get('availableStock')?.setValue(totalStock);
            
            // Auto-select first batch if available
            if (batches.length > 0) {
              this.selectBatch(itemIndex, batches[0]);
            }
          }
        },
        error: () => {
          this.notificationService.warning('Stock Warning', `Could not load batches for medicine ${medicineId}`);
        }
      });
  }

  selectBatch(itemIndex: number, batch: BatchSelection): void {
    const item = this.items.at(itemIndex);
    item.patchValue({
      selectedBatchId: batch.batchId,
      selectedBatchNumber: batch.batchNumber,
      selectedBatchExpiry: batch.expiryDate,
      unitPrice: batch.unitPrice
    });
  }

  getBatchesForItem(itemIndex: number): BatchSelection[] {
    const medicineId = this.items.at(itemIndex).get('medicineId')?.value;
    return this.availableBatches.get(medicineId) || [];
  }

  async searchSubstitute(itemIndex: number): Promise<void> {
    const item = this.items.at(itemIndex);
    const medicineId = item.get('medicineId')?.value;

    this.isLoading = true;
    this.pharmacyService.getSubstituteMedicines(medicineId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (substitutes) => {
          this.isLoading = false;
          
          if (substitutes.length === 0) {
            this.notificationService.warning('No Substitutes', 'No substitute medicines found');
            return;
          }

          const options: any = {};
          substitutes.forEach(sub => {
            options[sub.id] = `${sub.name} (${sub.strength}) - Stock: ${sub.availableStock}`;
          });

          const result = await Swal.fire({
            title: 'Select Substitute Medicine',
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Select a substitute',
            showCancelButton: true,
            confirmButtonText: 'Select',
            inputValidator: (value) => {
              if (!value) {
                return 'Please select a substitute medicine';
              }
              return null;
            }
          });

          if (result.isConfirmed && result.value) {
            const selected = substitutes.find(s => s.id === result.value);
            if (selected) {
              const reasonResult = await Swal.fire({
                title: 'Substitution Reason',
                input: 'textarea',
                inputLabel: 'Why is this medicine being substituted?',
                inputPlaceholder: 'Enter reason for substitution...',
                showCancelButton: true,
                inputValidator: (value) => {
                  if (!value) {
                    return 'Please provide a reason for substitution';
                  }
                  return null;
                }
              });

              if (reasonResult.isConfirmed) {
                item.patchValue({
                  substituted: true,
                  substituteMedicineId: selected.id,
                  substituteMedicineName: selected.name,
                  substituteReason: reasonResult.value,
                  status: ItemDispensingStatus.SUBSTITUTED
                });
                
                // Load batches for substitute medicine
                this.loadBatches(selected.id, item.get('prescribedQuantity')?.value);
                
                this.notificationService.success('Substituted', `Medicine substituted with ${selected.name}`);
              }
            }
          }
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.error('Error', 'Failed to load substitute medicines');
        }
      });
  }

  markOutOfStock(itemIndex: number): void {
    const item = this.items.at(itemIndex);
    item.patchValue({
      dispensedQuantity: 0,
      status: ItemDispensingStatus.OUT_OF_STOCK
    });
    this.notificationService.info('Marked', 'Medicine marked as out of stock');
  }

  private updateItemPrice(itemGroup: FormGroup): void {
    const quantity = itemGroup.get('dispensedQuantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;
    itemGroup.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
  }

  getTotalAmount(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.get('totalPrice')?.value || 0);
    }, 0);
  }

  getDispensedCount(): number {
    return this.items.controls.filter(item => 
      item.get('dispensedQuantity')?.value > 0
    ).length;
  }

  getOutOfStockCount(): number {
    return this.items.controls.filter(item => 
      item.get('status')?.value === ItemDispensingStatus.OUT_OF_STOCK
    ).length;
  }

  isPartialDispensing(): boolean {
    const totalItems = this.items.length;
    const dispensedItems = this.getDispensedCount();
    return dispensedItems > 0 && dispensedItems < totalItems;
  }

  async dispense(type: 'full' | 'partial'): Promise<void> {
    if (!this.validateDispensing(type)) {
      return;
    }

    const dispensedItems = this.getDispensedCount();
    const totalItems = this.items.length;

    let confirmMessage = '';
    if (type === 'full') {
      confirmMessage = `Dispense all ${totalItems} medicine(s) to patient?`;
    } else {
      confirmMessage = `Dispense ${dispensedItems} out of ${totalItems} medicine(s)? Remaining items will be marked as pending.`;
    }

    const result = await Swal.fire({
      title: 'Confirm Dispensing',
      html: `
        <div class="text-start">
          <p>${confirmMessage}</p>
          <p><strong>Patient:</strong> ${this.prescription?.patientName}</p>
          <p><strong>Prescription:</strong> ${this.prescription?.prescriptionNumber}</p>
          <p><strong>Total Amount:</strong> ₹${this.getTotalAmount().toFixed(2)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Dispense',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.isSubmitting = true;
    const dispensingData = this.prepareDispensingData(type);

    this.pharmacyService.dispenseMedicine(dispensingData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dispense) => {
          this.isSubmitting = false;
          this.notificationService.success('Success', 'Medicines dispensed successfully');
          this.logAudit(
            AuditAction.DISPENSE,
            `Dispensed medicines for prescription ${this.prescription?.prescriptionNumber}`
          );

          // Ask to print label
          Swal.fire({
            title: 'Dispensing Complete',
            text: 'Would you like to print the dispensing label?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Print Label',
            cancelButtonText: 'Back to Queue'
          }).then((printResult) => {
            if (printResult.isConfirmed) {
              this.pharmacyService.printDispensingLabel(dispense.id!);
            }
            this.router.navigate(['/pharmacy/queue']);
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          this.notificationService.error('Error', 'Failed to dispense medicines: ' + error.message);
        }
      });
  }

  private validateDispensing(type: 'full' | 'partial'): boolean {
    if (this.dispensingForm.invalid) {
      this.dispensingForm.markAllAsTouched();
      this.notificationService.error('Validation Error', 'Please fill all required fields');
      return false;
    }

    const dispensedCount = this.getDispensedCount();
    
    if (type === 'full' && dispensedCount !== this.items.length) {
      this.notificationService.error('Full Dispensing Required', 'All medicines must be dispensed for full dispensing');
      return false;
    }

    if (dispensedCount === 0) {
      this.notificationService.error('No Items', 'At least one medicine must be dispensed');
      return false;
    }

    // Validate batch selection for dispensed items
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items.at(i);
      const quantity = item.get('dispensedQuantity')?.value;
      if (quantity > 0 && !item.get('selectedBatchId')?.value) {
        this.notificationService.error('Batch Required', `Please select a batch for ${item.get('medicineName')?.value}`);
        return false;
      }
    }

    return true;
  }

  private prepareDispensingData(type: 'full' | 'partial'): MedicineDispense {
    const formValue = this.dispensingForm.value;
    
    const items: DispensingItem[] = this.items.controls
      .filter(item => item.get('dispensedQuantity')?.value > 0)
      .map(item => {
        const values = item.value;
        return {
          prescriptionItemId: values.prescriptionItemId,
          medicineId: values.substituted ? values.substituteMedicineId : values.medicineId,
          medicineName: values.substituted ? values.substituteMedicineName : values.medicineName,
          medicineType: values.medicineType,
          strength: values.strength,
          prescribedQuantity: values.prescribedQuantity,
          dispensedQuantity: values.dispensedQuantity,
          remainingQuantity: values.prescribedQuantity - values.dispensedQuantity,
          availableStock: values.availableStock,
          selectedBatchId: values.selectedBatchId,
          selectedBatchNumber: values.selectedBatchNumber,
          selectedBatchExpiry: values.selectedBatchExpiry,
          unitPrice: values.unitPrice,
          totalPrice: values.totalPrice,
          substituted: values.substituted,
          substituteMedicineId: values.substituteMedicineId,
          substituteMedicineName: values.substituteMedicineName,
          substituteReason: values.substituteReason,
          status: ItemDispensingStatus.DISPENSED,
          remarks: values.remarks
        };
      });

    const dispensingType = type === 'full' ? DispensingType.FULL : DispensingType.PARTIAL;

    return {
      prescriptionId: this.prescriptionId,
      prescriptionNumber: this.prescription!.prescriptionNumber,
      patientId: this.prescription!.patientId,
      patientName: this.prescription!.patientName,
      dispensingType,
      items,
      totalAmount: this.getTotalAmount(),
      paymentStatus: formValue.paymentStatus,
      paymentMethod: formValue.paymentMethod,
      paymentReference: formValue.paymentReference,
      dispensedBy: 'CurrentUser', // Should come from auth service
      dispensedAt: new Date(),
      remarks: formValue.remarks,
      printedCount: 0
    };
  }

  cancel(): void {
    Swal.fire({
      title: 'Cancel Dispensing?',
      text: 'Are you sure you want to cancel this dispensing?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No, Continue'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/pharmacy/queue']);
      }
    });
  }

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PHARMACY,
      'Dispensing',
      this.prescriptionId,
      details
    ).subscribe();
  }
}
