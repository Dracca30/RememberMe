import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../../Services/auth.service';
import { NotificationService } from '../../Services/notification.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit {
  readonly API = 'http://localhost:3000/api';
  deceased: any[] = [];
  loading = true;
  isSaving = false;
  selectedDeceasedId: string | null = null;
  form = {
    fullName: '',
    birthDate: '',
    deathDate: '',
    biography: '',
    epitaph: '',
    graveId: '',
    deceasedImage: ''
  };
  assignEmails: Record<string, string> = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.getUserRole() !== 'employee') {
      this.notification.show('Accesso riservato al personale comunale.', 'error');
      this.router.navigate(['/']);
      return;
    }
    this.loadDeceased();
  }

  loadDeceased(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.API}/Deceaseds`).subscribe({
      next: (data) => {
        this.deceased = data;
        this.loading = false;
      },
      error: () => {
        this.notification.show('Impossibile caricare i defunti. Riprova più tardi.', 'error');
        this.loading = false;
      }
    });
  }

  submitForm(event: Event): void {
    event.preventDefault();
    if (!this.form.fullName.trim() || !this.form.birthDate || !this.form.deathDate) {
      this.notification.show('Compila nome, data di nascita e di morte.', 'warning');
      return;
    }

    this.isSaving = true;
    const payload = {
      fullName: this.form.fullName.trim(),
      birthDate: this.form.birthDate,
      deathDate: this.form.deathDate,
      biography: this.form.biography.trim(),
      epitaph: this.form.epitaph.trim(),
      graveId: this.form.graveId.trim(),
      deceasedImage: this.form.deceasedImage.trim()
    };

    const request = this.selectedDeceasedId
      ? this.http.patch<any>(`${this.API}/Deceaseds/${this.selectedDeceasedId}`, payload)
      : this.http.post<any>(`${this.API}/Deceaseds`, payload);

    request.subscribe({
      next: () => {
        this.notification.show(this.selectedDeceasedId ? 'Defunto aggiornato correttamente.' : 'Defunto aggiunto con successo.', 'success');
        this.resetForm();
        this.loadDeceased();
      },
      error: () => {
        this.notification.show('Errore durante il salvataggio. Riprova più tardi.', 'error');
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  editDeceased(deceased: any): void {
    this.selectedDeceasedId = deceased._id;
    this.form = {
      fullName: deceased.fullName || '',
      birthDate: deceased.birthDate ? new Date(deceased.birthDate).toISOString().split('T')[0] : '',
      deathDate: deceased.deathDate ? new Date(deceased.deathDate).toISOString().split('T')[0] : '',
      biography: deceased.biography || '',
      epitaph: deceased.epitaph || deceased.biography || '',
      graveId: deceased.graveId || '',
      deceasedImage: deceased.deceasedImage || ''
    };
  }

  resetForm(): void {
    this.selectedDeceasedId = null;
    this.form = {
      fullName: '',
      birthDate: '',
      deathDate: '',
      biography: '',
      epitaph: '',
      graveId: '',
      deceasedImage: ''
    };
  }

  deleteDeceased(id: string): void {
    if (!confirm('Confermi la rimozione di questo defunto? Questa azione non è reversibile.')) {
      return;
    }

    this.http.delete(`${this.API}/Deceaseds/${id}`).subscribe({
      next: () => {
        this.notification.show('Defunto rimosso con successo.', 'success');
        this.loadDeceased();
      },
      error: () => {
        this.notification.show('Errore durante la cancellazione. Riprova più tardi.', 'error');
      }
    });
  }

  assignToEmail(deceased: any): void {
    const email = this.assignEmails[deceased._id]?.trim().toLowerCase();
    if (!email) {
      this.notification.show('Inserisci un indirizzo email valido per associare il defunto.', 'warning');
      return;
    }

    this.http.patch<any>(`${this.API}/Deceaseds/${deceased._id}/assign`, { email }).subscribe({
      next: (updated) => {
        this.notification.show('Defunto associato al profilo del parente.', 'success');
        this.updateDeceased(updated);
        this.assignEmails[deceased._id] = '';
      },
      error: () => {
        this.notification.show('Impossibile associare il defunto. Verifica l’indirizzo email.', 'error');
      }
    });
  }

  unassignUser(deceased: any, user: any): void {
    if (!user?.email) {
      return;
    }

    this.http.patch<any>(`${this.API}/Deceaseds/${deceased._id}/unassign`, { email: user.email }).subscribe({
      next: (updated) => {
        this.notification.show('Associazione rimossa con successo.', 'success');
        this.updateDeceased(updated);
      },
      error: () => {
        this.notification.show('Errore durante la rimozione dell’associazione.', 'error');
      }
    });
  }

  private updateDeceased(updated: any): void {
    const index = this.deceased.findIndex(d => d._id === updated._id);
    if (index >= 0) {
      this.deceased[index] = updated;
    } else {
      this.deceased.unshift(updated);
    }
  }
}
