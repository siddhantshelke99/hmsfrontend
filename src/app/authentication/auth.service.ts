/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError } from 'rxjs/internal/operators/catchError';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

interface AuthResponse {
  status: number;
  message: string;
  token: string;
  user: {
    is_admin: boolean;
    user_name: string;
    user_status: string;
    user_id: string;
    is_employee: boolean;
  };
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private spinner: NgxSpinnerService, private router: Router
  ) { }




  handleLoginRequest(data: any) {
    console.log(data, "Sending data to API:");

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.spinner.show();  

    const authData = {
      user_id: data?.user_id || undefined,
      email: data?.email || undefined,
      password: data?.password,
    };

    return this.http.post<AuthResponse>(`${environment.api_rul}/api/auth/authenticate`, authData, { headers, observe: 'response' })
      .pipe(
        catchError(error => {
          console.error('Login error:', error);
          this.spinner.hide();
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Please check your credentials and try again.',
          });
          return throwError(() => new Error('Login failed, please try again.'));
        })
      )
      .subscribe(response => {
        if (response['status'] === 200) {
          console.log('Login successful', response.body);

          // Store data in localStorage
          // localStorage.setItem('authToken', response.body.token);
          // localStorage.setItem('user', JSON.stringify(response.body.user));

          // // Role-based navigation
          // const userRole = response.body.user.is_employee || response.body.user.is_admin;
          // console.log(userRole);

          // if (response.body.user.is_employee) {
          //   // Navigate to employee dashboard
          //   this.router.navigate(['/default']);

          // } else if (response.body.user.is_admin) {
          //   // Navigate to admin dashboard
          //   this.router.navigate(['/default']);

          //   // this.router.navigate(['/admin-dashboard']);
          // } else {
            // Default navigation (for cases where role is not recognized)
            this.router.navigate(['/default']);
          

          // Hide loading spinner
          this.spinner.hide();

          // Show success pop-up using Swal
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome to the dashboard!',
          });

        } else if (response['status'] === 201 || response.body.message === 'Invalid credentials found!') {
          // Handle invalid credentials response
          Swal.fire({
            icon: 'error',
            title: 'Invalid Credentials',
            text: 'The credentials provided are invalid.',
          });
          console.log('Invalid credentials:', response);
          this.spinner.hide();  // Hide spinner in case of invalid credentials

        } else {
          // Handle other responses (e.g., unexpected error codes)
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Something went wrong. Please try again.',
          });
          console.log('Unexpected response:', response);
          this.spinner.hide();
        }
      });
  }



}


