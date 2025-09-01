import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { ZerodhaService } from '../../services/zerodha.service';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <mat-card class="auth-card">
      <mat-card-header>
        <mat-card-title>Zerodha Authentication</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>API Key</mat-label>
            <input matInput formControlName="apiKey" placeholder="Enter your Zerodha API Key">
            <mat-error *ngIf="authForm.get('apiKey')?.hasError('required')">
              API Key is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>API Secret</mat-label>
            <input matInput formControlName="apiSecret" placeholder="Enter your Zerodha API Secret">
            <mat-error *ngIf="authForm.get('apiSecret')?.hasError('required')">
              API Secret is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Request Token</mat-label>
            <input matInput formControlName="requestToken" placeholder="Enter your Refresh Token">
            <mat-error *ngIf="authForm.get('requestToken')?.hasError('required')">
              Request Token is required
            </mat-error>
          </mat-form-field>


          <div class="button-container">
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="authForm.invalid || isLoading">
              {{ isLoading ? 'Authenticating...' : 'Authenticate' }}
            </button>
          </div>

          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .auth-card {
      max-width: 400px;
      margin: 20px auto;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .button-container {
      text-align: center;
      margin-top: 16px;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 16px;
      text-align: center;
      font-size: 14px;
    }
  `]
})
export class AuthFormComponent {
  @Output() authenticated = new EventEmitter<void>();

  authForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private zerodhaService: ZerodhaService
  ) {
    this.authForm = this.fb.group({
      apiKey: ['', Validators.required],
      apiSecret: ['', Validators.required],
      requestToken: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.authForm.valid) {
      this.isLoading = true;
      this.error = '';

      const { apiKey, apiSecret, requestToken } = this.authForm.value;

      this.zerodhaService.authenticateWithRefreshToken(apiKey, apiSecret, requestToken)
        .subscribe({
          next: (response) => {
            this.zerodhaService.storeCredentials(apiKey, response.data.access_token);
            this.authenticated.emit();
            this.isLoading = false;
          },
          error: () => {
            this.error = 'Authentication failed. Please check your credentials.';
            this.isLoading = false;
          }
        });
    }
  }
}
