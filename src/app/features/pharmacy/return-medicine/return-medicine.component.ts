import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

import { LoaderComponent } from '@app/common';
import { NotificationService, AuditLogService, AuditAction, AuditModule } from '@app/common';
import { PharmacyService } from '../services/pharmacy.service';
import {
  MedicineDispense,
  ReturnMedicine,
  ReturnItem,
  ReturnReason,
  MedicineCondition,
  RefundStatus
} from '../models/pharmacy.model';

@Component({
  selector: 'app-return-medicine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoaderComponent],
  templateUrl: './return-medicine.component.html',
  styleUrls: ['./return-medicine.component.scss']
})
export class ReturnMedicineComponent implements OnInit, OnDestroy {
  returnForm!: FormGroup;
  dispensing: MedicineDispense | null = null;
  isLoading = false;
  isSubmitting = false;

  returnReasons = Object.values(ReturnReason);
  medicineConditions = Object.values(MedicineCondition);

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private pharmacyService: PharmacyService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {
    this.initializeForm();
    this.setupSearch();
  }

  ngOnInit(): void {
    this.logAudit(AuditAction.ACCESS, 'Accessed medicine return page');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.returnForm = this.fb.group({
      searchTerm: [''],
      dispensingId: [''],
      returnReason: ['', Validators.required],
      returnReasonDetails: [''],
      items: this.fb.array([]),
      remarks: ['']
    });

    // Make returnReasonDetails required when reason is OTHER
    this.returnForm.get('returnReason')?.valueChanges.subscribe(reason => {
      const detailsControl = this.returnForm.get('returnReasonDetails');
      if (reason === ReturnReason.OTHER) {
        detailsControl?.setValidators(Validators.required);
      } else {
        detailsControl?.clearValidators();
      }
      detailsControl?.updateValueAndValidity();
    });
  }

  get items(): FormArray {
    return this.returnForm.get('items') as FormArray;
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        switchMap(term => {
          if (!term || term.length < 3) {
            return [];
          }
          this.isLoading = true;
          // In real implementation, search by prescription number or patient
          return this.pharmacyService.getDispensingHistory({ searchTerm: term }, 1, 10);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result: any) => {
          this.isLoading = false;
          if (result.history && result.history.length > 0) {
            this.showDispensingOptions(result.history);
          } else {
            this.notificationService.warning('Not Found', 'No dispensing records found');
          }
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.error('Error', 'Failed to search dispensing records');
        }
      });
  }

  searchDispensing(term: string): void {
    this.searchSubject.next(term);
  }

  private async showDispensingOptions(history: any[]): Promise<void> {
    const options: any = {};
    history.forEach(h => {
      options[h.id] = `${h.prescriptionNumber} - ${h.patientName} - ${new Date(h.dispensingDate).toLocaleDateString()}`;
    });

    const result = await Swal.fire({
      title: 'Select Dispensing Record',
      input: 'select',
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: 'Select'
    });

    if (result.isConfirmed && result.value) {
      this.loadDispensing(result.value);
    }
  }

  loadDispensing(dispensingId: string): void {
    this.isLoading = true;
    
    this.pharmacyService.getDispensingById(dispensingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dispensing) => {
          this.dispensing = dispensing;
          this.returnForm.patchValue({ dispensingId: dispensing.id });
          this.initializeReturnItems();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to load dispensing details: ' + error.message);
          this.isLoading = false;
        }
      });
  }

  private initializeReturnItems(): void {
    if (!this.dispensing) return;

    this.items.clear();
    
    this.dispensing.items.forEach(dispensedItem => {
      const itemGroup = this.fb.group({
        dispensingItemId: [dispensedItem.id],
        medicineId: [dispensedItem.medicineId],
        medicineName: [dispensedItem.medicineName],
        batchId: [dispensedItem.selectedBatchId],
        batchNumber: [dispensedItem.selectedBatchNumber],
        dispensedQuantity: [dispensedItem.dispensedQuantity],
        returnQuantity: [0, [Validators.required, Validators.min(0)]],
        unitPrice: [dispensedItem.unitPrice],
        refundAmount: [{ value: 0, disabled: true }],
        condition: [MedicineCondition.SEALED_UNOPENED, Validators.required],
        restockable: [true],
        remarks: ['']
      });

      // Update refund amount when quantity changes
      itemGroup.get('returnQuantity')?.valueChanges.subscribe(() => this.updateRefundAmount(itemGroup));
      
      // Update restockable based on condition
      itemGroup.get('condition')?.valueChanges.subscribe(condition => {
        const restockable = condition === MedicineCondition.SEALED_UNOPENED || 
                           condition === MedicineCondition.OPENED_UNUSED;
        itemGroup.get('restockable')?.setValue(restockable);
      });

      this.items.push(itemGroup);
    });
  }

  private updateRefundAmount(itemGroup: FormGroup): void {
    const quantity = itemGroup.get('returnQuantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const dispensedQuantity = itemGroup.get('dispensedQuantity')?.value || 0;

    // Ensure return quantity doesn't exceed dispensed quantity
    if (quantity > dispensedQuantity) {
      itemGroup.get('returnQuantity')?.setValue(dispensedQuantity);
      return;
    }

    const refundAmount = quantity * unitPrice;
    itemGroup.get('refundAmount')?.setValue(refundAmount, { emitEvent: false });
  }

  getTotalRefundAmount(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.get('refundAmount')?.value || 0);
    }, 0);
  }

  getReturningCount(): number {
    return this.items.controls.filter(item => 
      item.get('returnQuantity')?.value > 0
    ).length;
  }

  async submitReturn(): Promise<void> {
    if (!this.validateReturn()) {
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Return',
      html: `
        <div class="text-start">
          <p><strong>Prescription:</strong> ${this.dispensing?.prescriptionNumber}</p>
          <p><strong>Patient:</strong> ${this.dispensing?.patientName}</p>
          <p><strong>Returning:</strong> ${this.getReturningCount()} medicine(s)</p>
          <p><strong>Refund Amount:</strong> ₹${this.getTotalRefundAmount().toFixed(2)}</p>
          <p class="text-warning mt-3">This return will require supervisor approval.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit Return',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.isSubmitting = true;
    const returnData = this.prepareReturnData();

    this.pharmacyService.returnMedicine(returnData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (returnRecord) => {
          this.isSubmitting = false;
          this.notificationService.success('Success', 'Medicine return submitted successfully. Awaiting approval.');
          this.logAudit(
            AuditAction.CREATE,
            `Submitted medicine return for prescription ${this.dispensing?.prescriptionNumber}, return ID: ${returnRecord.id}`
          );
          this.router.navigate(['/pharmacy/history']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.notificationService.error('Error', 'Failed to submit return: ' + error.message);
        }
      });
  }

  private validateReturn(): boolean {
    if (this.returnForm.invalid) {
      this.returnForm.markAllAsTouched();
      this.notificationService.error('Validation Error', 'Please fill all required fields');
      return false;
    }

    if (!this.dispensing) {
      this.notificationService.error('No Dispensing', 'Please select a dispensing record first');
      return false;
    }

    const returningCount = this.getReturningCount();
    if (returningCount === 0) {
      this.notificationService.error('No Items', 'Please specify at least one medicine to return');
      return false;
    }

    return true;
  }

  private prepareReturnData(): ReturnMedicine {
    const formValue = this.returnForm.value;
    
    const returnItems: ReturnItem[] = this.items.controls
      .filter(item => item.get('returnQuantity')?.value > 0)
      .map(item => {
        const values = item.value;
        return {
          dispensingItemId: values.dispensingItemId,
          medicineId: values.medicineId,
          medicineName: values.medicineName,
          batchId: values.batchId,
          batchNumber: values.batchNumber,
          dispensedQuantity: values.dispensedQuantity,
          returnQuantity: values.returnQuantity,
          unitPrice: values.unitPrice,
          refundAmount: values.refundAmount,
          condition: values.condition,
          restockable: values.restockable,
          remarks: values.remarks
        };
      });

    return {
      dispensingId: this.dispensing!.id!,
      prescriptionId: this.dispensing!.prescriptionId,
      prescriptionNumber: this.dispensing!.prescriptionNumber,
      patientId: this.dispensing!.patientId,
      patientName: this.dispensing!.patientName,
      returnDate: new Date(),
      returnReason: formValue.returnReason,
      returnReasonDetails: formValue.returnReasonDetails,
      items: returnItems,
      totalRefundAmount: this.getTotalRefundAmount(),
      refundStatus: RefundStatus.PENDING,
      processedBy: 'CurrentUser', // Should come from auth service
      remarks: formValue.remarks
    };
  }

  cancel(): void {
    this.router.navigate(['/pharmacy/queue']);
  }

  private logAudit(action: AuditAction, details: string): void {
    this.auditLogService.logAction(
      action,
      AuditModule.PHARMACY,
      'Return',
      this.dispensing?.id || '',
      details
    ).subscribe();
  }
}
