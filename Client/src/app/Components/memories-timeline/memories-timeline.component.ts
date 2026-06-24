import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Memory } from '../../Interfaces/Memory';
import { CemeteryService } from '../../Services/cemetery.service';
import { NotificationService } from '../../Services/notification.service';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-memories-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './memories-timeline.component.html',
  styleUrls: ['./memories-timeline.component.scss']
})
export class MemoriesTimelineComponent implements OnInit, OnChanges {
  @Input() deceasedId: string = '';
  @Input() deceasedName: string = '';

  memories: Memory[] = [];
  showForm = false;
  newAuthor = '';
  newMessage = '';
  selectedType: 'memory' | 'message' | 'prayer' = 'memory';
  loading = false;
  errorMessage = '';
  private maxMemories = 5;

  constructor(
    private cemeteryService: CemeteryService,
    private notification: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadMemories();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['deceasedId'] && changes['deceasedId'].currentValue) {
      this.loadMemories();
    }
  }

  addMemory() {
    // Controlla se l'utente è loggato
    if (!this.authService.isLoggedIn()) {
      this.notification.show('Effettua l\'accesso per aggiungere un ricordo', 'info');
      return;
    }

    if (!this.newAuthor.trim() || !this.newMessage.trim() || !this.deceasedId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.cemeteryService.addMemory(this.deceasedId, {
      author: this.newAuthor.trim(),
      message: this.newMessage.trim(),
      type: this.selectedType
    }).subscribe({
      next: (memories) => {
        this.memories = this.sortAndLimit(memories);
        this.resetForm();
        this.notification.show('Ricordo aggiunto con successo', 'success');
      },
      error: (error) => {
        console.error('Errore salvataggio ricordo:', error);
        this.errorMessage = 'Impossibile salvare il ricordo. Riprova.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteMemory(id: string) {
    if (!this.deceasedId) {
      return;
    }

    this.notification.confirm('Sei sicuro di voler eliminare questo ricordo?', 'Elimina Ricordo').then(confirmed => {
      if (confirmed) {
        this.cemeteryService.deleteMemory(this.deceasedId, id).subscribe({
          next: (memories) => {
            this.memories = this.sortAndLimit(memories);
            this.notification.show('Ricordo eliminato con successo', 'success');
          },
          error: (error) => {
            console.error('Errore eliminazione ricordo:', error);
            this.notification.show('Errore nell\'eliminazione del ricordo', 'error');
          }
        });
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'memory':
        return 'bi-book-half';
      case 'prayer':
        return 'bi-hands-pray';
      case 'message':
        return 'bi-chat-dots';
      default:
        return 'bi-star';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'memory':
        return 'Ricordo';
      case 'prayer':
        return 'Preghiera';
      case 'message':
        return 'Messaggio';
      default:
        return 'Altro';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;

    return date.toLocaleDateString('it-IT');
  }

  private loadMemories() {
    if (!this.deceasedId) {
      this.memories = [];
      return;
    }

    this.loading = true;
    this.cemeteryService.getDeceasedById(this.deceasedId).subscribe({
      next: (deceased) => {
        this.memories = this.sortAndLimit(deceased.memories || []);
      },
      error: (error) => {
        console.error('Errore nel caricamento dei ricordi:', error);
        this.memories = [];
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private sortAndLimit(memories: Memory[]) {
    return [...memories]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, this.maxMemories);
  }

  private resetForm() {
    this.newAuthor = '';
    this.newMessage = '';
    this.selectedType = 'memory';
    this.showForm = false;
  }
}
