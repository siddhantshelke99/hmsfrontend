import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api'; // Configure with environment

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, data, this.getHeaders())
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, data, this.getHeaders())
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${endpoint}`, data, this.getHeaders())
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Upload file
   */
  uploadFile<T>(endpoint: string, file: File, additionalData?: any): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get HTTP headers
   */
  private getHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      })
    };
  }

  /**
   * Get auth token
   */
  private getToken(): string {
    // TODO: Get from AuthService
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
        // TODO: Redirect to login
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden. You do not have permission.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }

    this.notificationService.error('API Error', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
