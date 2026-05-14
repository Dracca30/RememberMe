import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Input() isOpen: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();

  loginEmail: string = '';
  loginPassword: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  closeModal(): void {
    this.loginEmail = '';
    this.loginPassword = '';
    this.modalClosed.emit();
  }

  handleLogin(event: Event): void {
    event.preventDefault();

    if (!this.loginEmail || !this.loginPassword) {
      this.showToast('Inserisci email e password', 'warning');
      return;
    }

    const email = this.loginEmail.trim().toLowerCase();

    this.authService.login(email, this.loginPassword).subscribe({
      next: (account) => {
        this.closeModal();
        sessionStorage.setItem('loginSuccessMessage', `Benvenuto ${account.fullName || account.username}! Accesso effettuato con successo.`);
        this.router.navigate(['/']);
      },
      error: (error) => {
        const message = error?.error?.message || 'Email o password non validi';
        this.showToast(message, 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: ${this.getToastColor(type)}; color: white; padding: 12px 24px;
      border-radius: 50px; font-size: 0.9rem; font-weight: 500;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;
      animation: slideUp 0.3s ease; max-width: 90%; text-align: center;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  private getToastColor(type: string): string {
    const colors: { [key: string]: string } = {
      'success': '#4caf50',
      'warning': '#ff9800',
      'info': '#00d4ff',
      'error': '#f44336'
    };
    return colors[type] || colors['info'];
  }
}
