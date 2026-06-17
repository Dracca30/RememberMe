import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';
import { NotificationService } from '../../Services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, CookieBannerComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="change-password-container pb-32">
      <div class="password-card glass-card">
        <button class="back-btn mobile-only" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1>Cambia Password</h1>

        <form (ngSubmit)="changePassword()" #passwordForm="ngForm">
          <div class="form-group">
            <label for="currentPassword">Password Attuale *</label>
            <input
              type="password"
              id="currentPassword"
              class="form-control"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              placeholder="Inserisci la tua password attuale"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">Nuova Password *</label>
            <input
              type="password"
              id="newPassword"
              class="form-control"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              placeholder="Inserisci la nuova password"
              (input)="checkPasswordStrength()"
            />
            <div class="password-strength" *ngIf="newPassword">
              <div class="strength-bar">
                <div class="strength-fill" 
                     [style.width.%]="passwordStrength"
                     [class.weak]="passwordStrength < 40"
                     [class.medium]="passwordStrength >= 40 && passwordStrength < 70"
                     [class.strong]="passwordStrength >= 70">
                </div>
              </div>
              <p class="strength-text">
                <span *ngIf="passwordStrength < 40" class="weak">Debole</span>
                <span *ngIf="passwordStrength >= 40 && passwordStrength < 70" class="medium">Media</span>
                <span *ngIf="passwordStrength >= 70" class="strong">Forte</span>
              </p>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Conferma Nuova Password *</label>
            <input
              type="password"
              id="confirmPassword"
              class="form-control"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              placeholder="Conferma la nuova password"
            />
          </div>

          <div class="password-requirements">
            <p>La password deve contenere:</p>
            <ul>
              <li [class.valid]="hasMinLength">
                <i class="bi" [class.bi-check-circle]="hasMinLength" [class.bi-circle]="!hasMinLength"></i>
                Almeno 8 caratteri
              </li>
              <li [class.valid]="hasUpperCase">
                <i class="bi" [class.bi-check-circle]="hasUpperCase" [class.bi-circle]="!hasUpperCase"></i>
                Una lettera maiuscola
              </li>
              <li [class.valid]="hasLowerCase">
                <i class="bi" [class.bi-check-circle]="hasLowerCase" [class.bi-circle]="!hasLowerCase"></i>
                Una lettera minuscola
              </li>
              <li [class.valid]="hasNumber">
                <i class="bi" [class.bi-check-circle]="hasNumber" [class.bi-circle]="!hasNumber"></i>
                Un numero
              </li>
              <li [class.valid]="hasSpecialChar">
                <i class="bi" [class.bi-check-circle]="hasSpecialChar" [class.bi-circle]="!hasSpecialChar"></i>
                Un carattere speciale (!&#64;#$%^&*)
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            class="btn btn-blue w-100"
            [disabled]="!passwordForm.valid || !isPasswordValid()">
            <i class="bi bi-lock"></i>
            Cambia Password
          </button>
        </form>
      </div>
    </div>
    <app-cookie-banner></app-cookie-banner>
    <app-footer></app-footer>
  `,
  styles: [`
    .change-password-container {
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 70px;
    }

    .password-card {
      width: 100%;
      max-width: 500px;
      background: var(--glass-bg);
      border-radius: 12px;
      padding: 40px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .back-btn {
      display: none;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      margin-bottom: 20px;
      padding: 0;
      color: currentColor;
    }

    @media (max-width: 768px) {
      .back-btn {
        display: block;
      }

      .password-card {
        padding: 20px;
      }
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 30px;
      color: var(--cyan-glow);
      text-align: center;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      opacity: 0.9;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
      color: inherit;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--cyan-glow);
      background: rgba(0, 255, 255, 0.05);
    }

    .password-strength {
      margin-top: 10px;
    }

    .strength-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 5px;
    }

    .strength-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .strength-fill.weak {
      background: #ff4444;
    }

    .strength-fill.medium {
      background: #ffaa00;
    }

    .strength-fill.strong {
      background: #44aa44;
    }

    .strength-text {
      font-size: 0.85rem;
      margin: 0;
    }

    .strength-text span {
      font-weight: 600;
    }

    .strength-text .weak {
      color: #ff4444;
    }

    .strength-text .medium {
      color: #ffaa00;
    }

    .strength-text .strong {
      color: #44aa44;
    }

    .password-requirements {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .password-requirements p {
      margin: 0 0 10px 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .password-requirements ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .password-requirements li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      margin-bottom: 8px;
      opacity: 0.7;
    }

    .password-requirements li.valid {
      opacity: 1;
      color: #44aa44;
    }

    .password-requirements i {
      min-width: 16px;
    }

    .btn {
      padding: 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-blue {
      background: linear-gradient(135deg, #00ffff, #0088ff);
      color: #000;
    }

    .btn-blue:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ChangePasswordComponent implements OnInit {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  passwordStrength = 0;
  hasMinLength = false;
  hasUpperCase = false;
  hasLowerCase = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(
    private location: Location,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  checkPasswordStrength(): void {
    const pwd = this.newPassword;
    let strength = 0;

    this.hasMinLength = pwd.length >= 8;
    this.hasUpperCase = /[A-Z]/.test(pwd);
    this.hasLowerCase = /[a-z]/.test(pwd);
    this.hasNumber = /[0-9]/.test(pwd);
    this.hasSpecialChar = /[!@#$%^&*]/.test(pwd);

    if (this.hasMinLength) strength += 20;
    if (this.hasUpperCase) strength += 20;
    if (this.hasLowerCase) strength += 20;
    if (this.hasNumber) strength += 20;
    if (this.hasSpecialChar) strength += 20;

    this.passwordStrength = strength;
  }

  isPasswordValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.hasMinLength &&
      this.hasUpperCase &&
      this.hasLowerCase &&
      this.hasNumber &&
      this.hasSpecialChar &&
      this.newPassword === this.confirmPassword
    );
  }

  changePassword(): void {
    if (!this.isPasswordValid()) {
      this.notification.show('Compila correttamente tutti i campi', 'warning');
      return;
    }

    // TODO: Implementare la chiamata API per cambiar la password
    this.notification.confirm('Sei sicuro di voler cambiare la password?', 'Cambia Password').then(confirmed => {
      if (confirmed) {
        // Simula l'API call
        this.notification.show('Password cambiata con successo', 'success');
        setTimeout(() => {
          this.location.back();
        }, 1500);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
