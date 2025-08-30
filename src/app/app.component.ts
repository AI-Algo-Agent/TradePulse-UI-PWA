import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthFormComponent } from './components/auth-form/auth-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ZerodhaService } from './services/zerodha.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    AuthFormComponent,
    DashboardComponent
  ],
  template: `
    <div class="app-container">
      <app-auth-form 
        *ngIf="!isAuthenticated" 
        (authenticated)="onAuthenticated()">
      </app-auth-form>
      
      <app-dashboard 
        *ngIf="isAuthenticated">
      </app-dashboard>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: #fafafa;
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated = false;

  constructor(private zerodhaService: ZerodhaService) {}

  ngOnInit(): void {
    this.isAuthenticated = !!this.zerodhaService.getCredentials();
  }

  onAuthenticated(): void {
    this.isAuthenticated = true;
  }
}