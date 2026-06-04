import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import AOS from 'aos';
import { CookieService, CookiePreferences } from '../../Services/cookie.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cookie-banner.component.scss'],
  template: `
    <div class="cookie-banner" *ngIf="showBanner" data-aos="zoom-in" data-aos-duration="700" data-aos-offset="0" data-aos-once="true">
      <div class="cookie-container">
        <div class="cookie-header">
          <i class="bi bi-shield-shaded"></i>
          <h3>Rispettiamo la tua privacy</h3>
        </div>
        
        <p class="cookie-text">
          Utilizziamo cookie minimali per migliorare la tua esperienza. 
          Ricorda che questa app tratta temi sensibili - la tua privacy è la nostra priorità.
        </p>

        <div class="cookie-preferences" *ngIf="showDetails">
          <div class="cookie-option">
            <label class="cookie-label">
              <input type="checkbox" [(ngModel)]="preferences.functional" disabled checked>
              <span>
                <strong>Cookie funzionali</strong>
                <small>Necessari per il funzionamento dell'app</small>
              </span>
            </label>
          </div>

          <div class="cookie-option">
            <label class="cookie-label">
              <input type="checkbox" [(ngModel)]="preferences.analytics">
              <span>
                <strong>Cookie analitici</strong>
                <small>Ci aiutano a capire come usi l'app</small>
              </span>
            </label>
          </div>

          <div class="cookie-option">
            <label class="cookie-label">
              <input type="checkbox" [(ngModel)]="preferences.marketing">
              <span>
                <strong>Cookie di marketing</strong>
                <small>Mai utilizzati - opzione disabilitata per rispetto</small>
              </span>
            </label>
          </div>
        </div>

        <div class="cookie-actions">
          <button (click)="toggleDetails()" class="cookie-link">
            {{ showDetails ? 'Meno opzioni' : 'Personalizza' }}
          </button>
          
          <div class="cookie-buttons">
            <button (click)="acceptEssential()" class="cookie-btn cookie-btn-secondary">
              Solo essenziali
            </button>
            <button (click)="acceptAll()" class="cookie-btn cookie-btn-primary">
              Accetta tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  `,

})
export class CookieBannerComponent implements OnInit {
  showBanner = false;
  showDetails = false;
  
  preferences: CookiePreferences = {
    functional: true,
    analytics: false,
    marketing: false,
    lastUpdated: new Date()
  };

  constructor(private cookieService: CookieService) {}

  ngOnInit(): void {
    this.cookieService.showBanner$.subscribe(show => {
      this.showBanner = show;
      if (show) {
        AOS.refresh();
      }
    });
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  acceptEssential(): void {
    this.preferences.analytics = false;
    this.preferences.marketing = false;
    this.cookieService.setConsent(this.preferences);
  }

  acceptAll(): void {
    this.preferences.analytics = true;
    this.preferences.marketing = false;
    this.cookieService.setConsent(this.preferences);
  }
}