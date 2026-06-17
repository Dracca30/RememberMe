import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CookieBannerComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="terms-container pb-32">
      <div class="terms-content">
        <button class="back-btn mobile-only" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1>Termini di Servizio</h1>
        
        <section class="terms-section">
          <h2>1. Accettazione dei Termini</h2>
          <p>
            Utilizzando RememberMe, accetti questi Termini di Servizio in loro interezza. Se non accetti questi termini, 
            non utilizzare il servizio.
          </p>
        </section>

        <section class="terms-section">
          <h2>2. Descrizione del Servizio</h2>
          <p>
            RememberMe è un'applicazione web/mobile che consente agli utenti di commemorare i loro cari defunti, 
            condividere ricordi e accedere alle mappe dei cimiteri.
          </p>
        </section>

        <section class="terms-section">
          <h2>3. Responsabilità dell'Utente</h2>
          <p>Accetti di:</p>
          <ul>
            <li>Utilizzi l'app solo per scopi legittimi e legali</li>
            <li>Non caricherai contenuti offensivi, discriminatori o illegittimi</li>
            <li>Rispetterai la privacy e i diritti altrui</li>
            <li>Manterrai la tua password riservata e protetta</li>
            <li>Sarai responsabile di tutte le attività sotto il tuo account</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>4. Diritti di Proprietà Intellettuale</h2>
          <p>
            Tutti i contenuti dell'applicazione RememberMe, inclusi testi, grafica, logo e codice, sono proprietà 
            di RememberMe. Non puoi riprodurli, modificarli o distribuirli senza autorizzazione.
          </p>
        </section>

        <section class="terms-section">
          <h2>5. Contenuti Caricati dagli Utenti</h2>
          <p>
            Mantenendo il caricamento di contenuti su RememberMe (foto, ricordi, storie), concedi a RememberMe 
            una licenza per archiviare e visualizzare questo contenuto. Rimani il proprietario dei tuoi contenuti.
          </p>
        </section>

        <section class="terms-section">
          <h2>6. Limitazione di Responsabilità</h2>
          <p>
            RememberMe è fornito "così com'è" senza garanzie di sorta. Non siamo responsabili per perdite di dati, 
            interruzioni di servizio o danni causati dall'uso dell'app.
          </p>
        </section>

        <section class="terms-section">
          <h2>7. Modifiche ai Termini</h2>
          <p>
            Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche entreranno in vigore 
            immediatamente. L'uso continuato dell'app costituisce accettazione dei termini modificati.
          </p>
        </section>

        <section class="terms-section">
          <h2>8. Terminazione</h2>
          <p>
            Possiamo terminare o sospendere il tuo account se violi questi termini o se necessario per motivi legali o 
            di sicurezza.
          </p>
        </section>

        <section class="terms-section">
          <h2>9. Legge Applicabile</h2>
          <p>
            Questi Termini di Servizio sono disciplinati dalle leggi italiane e internazionali applicabili.
          </p>
        </section>

        <section class="terms-section">
          <h2>10. Contatti</h2>
          <p>
            Per domande sui Termini di Servizio, contattaci a: support&#64;rememberme.com
          </p>
        </section>

        <section class="terms-section">
          <p class="last-update">Ultimo aggiornamento: {{ currentDate | date: 'dd/MM/yyyy' }}</p>
        </section>
      </div>
    </div>
    <app-cookie-banner></app-cookie-banner>
    <app-footer></app-footer>
  `,
  styles: [`
    .terms-container {
      min-height: 100vh;
      padding: 20px;
      margin-top: 70px;
    }

    .terms-content {
      max-width: 900px;
      margin: 0 auto;
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

      .terms-content {
        padding: 20px;
      }
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 30px;
      color: var(--cyan-glow);
      text-align: center;
    }

    h2 {
      font-size: 1.5rem;
      margin-top: 25px;
      margin-bottom: 15px;
      color: var(--cyan-glow);
    }

    .terms-section {
      margin-bottom: 25px;
      line-height: 1.8;
    }

    p {
      margin-bottom: 10px;
      opacity: 0.9;
    }

    ul {
      margin-left: 20px;
      margin-bottom: 15px;
    }

    li {
      margin-bottom: 8px;
      opacity: 0.85;
    }

    .last-update {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 40px;
      text-align: center;
    }
  `]
})
export class TermsOfServiceComponent implements OnInit {
  currentDate = new Date();

  constructor(private location: Location) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    this.location.back();
  }
}
