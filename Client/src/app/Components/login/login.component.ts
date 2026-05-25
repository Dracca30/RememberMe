import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { NotificationService } from '../../Services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterModule],
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
    private authService: AuthService,
    private notification: NotificationService
  ) {}

  closeModal(): void {
    this.loginEmail = '';
    this.loginPassword = '';
    this.modalClosed.emit();
  }

  handleLogin(event: Event): void {
    event.preventDefault();

    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      this.notification.show('Per favore, compila email e password.', 'warning');
      return;
    }

    const email = this.loginEmail.trim().toLowerCase();

    this.authService.login(email, this.loginPassword).subscribe({
      next: (account) => {
        this.closeModal();
        this.notification.show(`Benvenuto ${account.fullName || account.username}! Accesso effettuato con successo.`, 'success');
      },
      error: () => {
        this.notification.show('Email o password non valide. Riprova.', 'error');
        this.loginPassword = '';
      }
    });
  }
}
