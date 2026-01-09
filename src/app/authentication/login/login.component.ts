
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterModule,ReactiveFormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  signinFormGroup: FormGroup;
isLoading: boolean =false;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    
  }
  ngOnInit(): void {
    localStorage.clear()
    this.signinFormGroup = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }
  login() {
    if (this.signinFormGroup.invalid) {
      this.signinFormGroup.markAllAsTouched();
      return;
    }
    this.authService.handleLoginRequest(this.signinFormGroup.value);
  }
  
}
