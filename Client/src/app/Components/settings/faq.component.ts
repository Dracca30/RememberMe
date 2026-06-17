import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CookieBannerComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="faq-container pb-32">
      <div class="faq-content">
        <button class="back-btn mobile-only" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1>Domande Frequenti</h1>

        <div class="faq-list">
          <div class="faq-item glass-card" *ngFor="let item of faqItems">
            <button class="faq-question" (click)="toggleFAQ(item.id)">
              <span>{{ item.question }}</span>
              <i class="bi" [class.bi-chevron-down]="!item.expanded" [class.bi-chevron-up]="item.expanded"></i>
            </button>
            <div class="faq-answer" *ngIf="item.expanded">
              <p>{{ item.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-cookie-banner></app-cookie-banner>
    <app-footer></app-footer>
  `,
  styles: [`
    .faq-container {
      min-height: 100vh;
      padding: 20px;
      margin-top: 70px;
    }

    .faq-content {
      max-width: 900px;
      margin: 0 auto;
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
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 30px;
      color: var(--cyan-glow);
      text-align: center;
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .faq-item {
      background: var(--glass-bg);
      border-radius: 12px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .faq-question {
      width: 100%;
      padding: 20px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 500;
      color: inherit;
      transition: all 0.3s ease;
    }

    .faq-question:hover {
      background: rgba(0, 255, 255, 0.05);
    }

    .faq-question i {
      transition: transform 0.3s ease;
      color: var(--cyan-glow);
    }

    .faq-answer {
      padding: 0 20px 20px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      animation: slideDown 0.3s ease;
    }

    .faq-answer p {
      margin: 0;
      opacity: 0.85;
      line-height: 1.6;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class FaqComponent implements OnInit {
  faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'Come creo un account?',
      answer: 'Puoi creare un account cliccando sul pulsante "Registrati" nella homepage. Compila il form con i tuoi dati e segui le istruzioni per verificare la tua email.',
      expanded: false
    },
    {
      id: 2,
      question: 'Come aggiungo un defunto?',
      answer: 'Se sei un dipendente, puoi accedere a "Aggiungi Deceduto" dalla navbar. Se sei un utente normale, puoi gestire i tuoi parenti nella sezione "Parenti".',
      expanded: false
    },
    {
      id: 3,
      question: 'Come condivido ricordi?',
      answer: 'Nel profilo di ogni defunto, troverai la sezione "Libro dei Ricordi". Clicca su "Aggiungi" per condividere un ricordo, un messaggio o una preghiera.',
      expanded: false
    },
    {
      id: 4,
      question: 'Come funziona la ricerca dei cimiteri?',
      answer: 'Utilizza la barra di ricerca nella homepage per cercare cimiteri per nome, città o descrizione. I risultati sono ordinati per distanza da te se la geolocalizzazione è attiva.',
      expanded: false
    },
    {
      id: 5,
      question: 'Come visualizzo il percorso verso un cimitero?',
      answer: 'Nel dettaglio del cimitero, troverai informazioni sul percorso multimodale. Se la distanza è grande, il sistema suggerisce aereo, traghetto o auto. Puoi anche aprire in Google Maps.',
      expanded: false
    },
    {
      id: 6,
      question: 'Come cambio la password?',
      answer: 'Vai a Impostazioni > Privacy e Sicurezza > Cambia Password. Inserisci la tua password attuale e la nuova password che desideri utilizzare.',
      expanded: false
    },
    {
      id: 7,
      question: 'Posso cancellare il mio account?',
      answer: 'Sì, puoi richiedere la cancellazione del tuo account contattando il nostro supporto a support@rememberme.com. Verifica la tua identità prima di procedere.',
      expanded: false
    },
    {
      id: 8,
      question: 'Quali dati raccogli?',
      answer: 'Raccogliamo email, nome, dati di localizzazione (con tuo consenso), foto e ricordi che carichi. Leggi la nostra Privacy Policy per dettagli completi.',
      expanded: false
    },
    {
      id: 9,
      question: 'Come contatto il supporto?',
      answer: 'Puoi contattare il supporto tramite email (support@rememberme.com) o WhatsApp. Troverai i contatti nella sezione Impostazioni > Contatti e Supporto.',
      expanded: false
    },
    {
      id: 10,
      question: 'L\'app è disponibile su iOS e Android?',
      answer: 'RememberMe è disponibile come web app responsive. Puoi accedervi dal browser del tuo smartphone (iOS, Android o qualsiasi altro).',
      expanded: false
    }
  ];

  constructor(private location: Location) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFAQ(id: number): void {
    const item = this.faqItems.find(i => i.id === id);
    if (item) {
      item.expanded = !item.expanded;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
