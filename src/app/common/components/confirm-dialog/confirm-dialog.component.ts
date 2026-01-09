import { Component, Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogComponent {
  
  /**
   * Show confirmation dialog
   */
  async confirm(
    title: string = 'Confirm Action',
    message: string = 'Are you sure you want to proceed?',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    icon: SweetAlertIcon = 'question'
  ): Promise<boolean> {
    const result: SweetAlertResult = await Swal.fire({
      title,
      text: message,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true
    });

    return result.isConfirmed;
  }

  /**
   * Show danger/delete confirmation dialog
   */
  async confirmDelete(
    title: string = 'Delete Confirmation',
    message: string = 'This action cannot be undone!',
    confirmText: string = 'Yes, Delete',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    const result: SweetAlertResult = await Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true
    });

    return result.isConfirmed;
  }

  /**
   * Show success message
   */
  success(title: string, message?: string): void {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#28a745'
    });
  }

  /**
   * Show error message
   */
  error(title: string, message?: string): void {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    });
  }

  /**
   * Show warning message
   */
  warning(title: string, message?: string): void {
    Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107'
    });
  }

  /**
   * Show info message
   */
  info(title: string, message?: string): void {
    Swal.fire({
      title,
      html: message, // Use html instead of text to support HTML content
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#17a2b8'
    });
  }

  /**
   * Show prompt/input dialog
   */
  async prompt(
    title: string,
    message: string,
    placeholder: string = '',
    confirmText: string = 'Submit',
    cancelText: string = 'Cancel'
  ): Promise<SweetAlertResult> {
    return await Swal.fire({
      title,
      text: message,
      input: 'text',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'This field is required!';
        }
        return null;
      }
    });
  }

  /**
   * Show loading indicator
   */
  showLoading(title: string = 'Processing...', message?: string): void {
    Swal.fire({
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Close any open dialog
   */
  close(): void {
    Swal.close();
  }
}
