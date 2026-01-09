import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import { ConfirmDialogComponent, LoaderComponent } from '@app/common';
import { AuditLogService, AuditAction, AuditModule } from '@app/common';

@Component({
  selector: 'app-upload-invoice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upload-invoice.component.html',
  styleUrls: ['./upload-invoice.component.scss']
})
export class UploadInvoiceComponent {
  selectedFile: File | null = null;
  isDragging: boolean = false;
  isUploading: boolean = false;
  uploadProgress: number = 0;

  constructor(
    private inventoryService: InventoryService,
    private confirmDialog: ConfirmDialogComponent,
    private auditLog: AuditLogService,
    private router: Router
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  validateAndSetFile(file: File): void {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      this.confirmDialog.warning('Invalid File', 'Please upload PDF, JPG, or PNG files only');
      return;
    }

    if (file.size > maxSize) {
      this.confirmDialog.warning('File Too Large', 'File size must be less than 10MB');
      return;
    }

    this.selectedFile = file;
  }

  clearFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  async uploadInvoice(): Promise<void> {
    if (!this.selectedFile) return;

    const confirmed = await this.confirmDialog.confirm(
      'Upload Invoice',
      'Upload and process invoice using OCR? (Feature under development)',
      'Yes, Upload',
      'Cancel',
      'question'
    );

    if (confirmed) {
      this.isUploading = true;
      this.uploadProgress = 0;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 200);

      this.inventoryService.uploadInvoice(this.selectedFile).subscribe({
        next: (result) => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
          this.isUploading = false;

          this.confirmDialog.success(
            'Upload Successful', 
            'Invoice uploaded. OCR processing will be available soon. Please create entry manually for now.'
          );

          this.auditLog.logAction(
            AuditAction.CREATE,
            AuditModule.INVENTORY,
            'InvoiceUpload',
            result.id || 'temp',
            `Uploaded invoice file: ${this.selectedFile?.name}`
          ).subscribe();

          // Navigate to create form (OCR feature placeholder)
          setTimeout(() => {
            this.router.navigate(['/inventory/inward/create']);
          }, 2000);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isUploading = false;
          this.uploadProgress = 0;
          this.confirmDialog.error('Upload Failed', 'OCR feature is under development. Please create entry manually.');
          
          // Navigate to manual entry
          setTimeout(() => {
            this.router.navigate(['/inventory/inward/create']);
          }, 2000);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory/inward']);
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const sizeInMB = this.selectedFile.size / (1024 * 1024);
    return sizeInMB.toFixed(2) + ' MB';
  }
}
