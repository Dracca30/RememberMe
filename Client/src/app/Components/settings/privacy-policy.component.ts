import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CookieBannerComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="privacy-policy-container pb-32">
      <div class="policy-content">
        <button class="back-btn mobile-only" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1>Privacy Policy</h1>
        
        <section class="policy-section">
          <h2>1. Introduzione</h2>
          <p>
            RememberMe si impegna a proteggere la tua privacy. Questa politica sulla privacy spiega come raccogliamo, 
            utilizziamo, divulghiamo e proteggiamo i tuoi dati quando usi la nostra applicazione.
          </p>
        </section>

        <section class="policy-section">
          <h2>2. Informazioni che raccogliamo</h2>
          <p>Raccogliamo informazioni da te in vari modi:</p>
          <ul>
            <li><strong>Informazioni di account:</strong> Nome, email, password hash quando ti registri</li>
            <li><strong>Dati di localizzazione:</strong> Posizione GPS per calcolare distanze dai cimiteri</li>
            <li><strong>Dati dei defunti:</strong> Informazioni sui tuoi parenti defunti che carichi</li>
            <li><strong>Foto e memoria:</strong> Immagini e ricordi che condividi sulla piattaforma</li>
            <li><strong>Dati di utilizzo:</strong> Come usi l'app, pagine visitate, link cliccati</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>3. Come utilizziamo le tue informazioni</h2>
          <p>Utilizziamo le informazioni per:</p>
          <ul>
            <li>Fornire e migliorare i servizi di RememberMe</li>
            <li>Personalizzare la tua esperienza</li>
            <li>Inviare comunicazioni di servizio e aggiornamenti</li>
            <li>Rispondere alle tue domande e richieste</li>
            <li>Analizzare l'utilizzo e migliorare il servizio</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>4. Sicurezza dei dati</h2>
          <p>
            Implementiamo misure di sicurezza appropriate per proteggere i tuoi dati personali contro accessi non autorizzati, 
            alterazioni, divulgazioni o distruzioni. Le password vengono hashate utilizzando algoritmi moderni.
          </p>
        </section>

        <section class="policy-section">
          <h2>5. Condivisione dei dati</h2>
          <p>
            Non vendiamo, scambiamo o noleggiamo i tuoi dati personali a terzi. Possiamo condividere informazioni anonime 
            e aggregate per scopi analitici.
          </p>
        </section>

        <section class="policy-section">
          <h2>6. Diritti dell'utente</h2>
          <p>Hai il diritto di:</p>
          <ul>
            <li>Accedere ai tuoi dati personali</li>
            <li>Richiedere la correzione di dati errati</li>
            <li>Richiedere l'eliminazione dei tuoi dati</li>
            <li>Ritirare il tuo consenso in qualsiasi momento</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>7. Contatti</h2>
          <p>
            Per domande sulla privacy, contattaci a: support&#64;rememberme.com
          </p>
        </section>

        <section class="policy-section">
          <p class="last-update">Ultimo aggiornamento: {{ currentDate | date: 'dd/MM/yyyy' }}</p>
        </section>
      </div>
    </div>
    <app-cookie-banner></app-cookie-banner>
    <app-footer></app-footer>
  `,
  styles: [`
    .privacy-policy-container {
      min-height: 100vh;
      padding: 20px;
      margin-top: 70px;
    }

    .policy-content {
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

      .policy-content {
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

    .policy-section {
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
export class PrivacyPolicyComponent implements OnInit {
  currentDate = new Date();

  constructor(private location: Location) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    this.location.back();
  }
}
