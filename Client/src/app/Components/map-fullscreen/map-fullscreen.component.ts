import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CemeteryService } from '../../Services/cemetery.service';
import { GeolocationService } from '../../Services/geolocation.service';
import { LeafletMapService, TransportMode, RouteInfo } from '../../Services/leaflet-map.service';
import { Cemetery } from '../../Interfaces/Cemetery';
import { NavbarComponent } from '../navbar/navbar.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-map-fullscreen',
  standalone: true,
  imports: [CommonModule, CookieBannerComponent, NavbarComponent, FooterComponent],
  templateUrl: './map-fullscreen.component.html',
  styleUrls: ['./map-fullscreen.component.scss']
})
export class MapFullscreenComponent implements OnInit, AfterViewInit {
  @ViewChild('fullscreenMap') fullscreenMap!: ElementRef;
  cemeteries: Cemetery[] = [];
  userLocation?: { lat: number; lng: number };
  errorMessage = '';
  private map: any;
  private userMarker: any;
  private viewReady = false;

  constructor(
    private cemeteryService: CemeteryService,
    private geolocationService: GeolocationService,
    private mapService: LeafletMapService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCemeteries();
    this.loadUserLocation();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.tryInitializeMap();
  }

  private loadCemeteries() {
    this.cemeteryService.getAllCemeteries().subscribe({
      next: (data) => {
        this.cemeteries = data;
        this.tryInitializeMap();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Impossibile caricare i cimiteri. Riprova più tardi.';
      }
    });
  }

  private loadUserLocation() {
    this.geolocationService.getCurrentPosition()
      .then((location) => {
        this.userLocation = location;
        if (this.map) {
          this.centerOnUserLocation();
        } else {
          this.tryInitializeMap();
        }
      })
      .catch((err) => {
        console.warn('Geolocalizzazione non disponibile', err);
        this.errorMessage = 'Impossibile ottenere la posizione. Verranno mostrati comunque i cimiteri.';
        this.tryInitializeMap();
      });
  }

  private async tryInitializeMap() {
    if (!this.viewReady || !this.cemeteries.length) {
      return;
    }

    if (!this.map) {
      const centerLat = this.userLocation?.lat ?? (this.cemeteries[0].lat ?? 41.9028); // Default to Rome, Italy
      const centerLng = this.userLocation?.lng ?? (this.cemeteries[0].lng ?? 12.4964);
      const zoom = this.userLocation ? 12 : 8;

      this.map = await this.mapService.initMap(this.fullscreenMap.nativeElement, centerLat, centerLng, zoom);

      if (this.userLocation) {
        this.centerOnUserLocation();
      }

      this.cemeteries.forEach((cemetery) => {
        if (cemetery.lat !== undefined && cemetery.lng !== undefined) {
          const marker = this.mapService.addMarker(this.map, cemetery.lat, cemetery.lng, cemetery.name, 'red');
          marker.on('click', () => this.onCemeteryMarkerClick(cemetery, marker));
        }
      });

      if (!this.userLocation) {
        const positions = this.cemeteries
          .filter((cemetery) => cemetery.lat !== undefined && cemetery.lng !== undefined)
          .map((cemetery) => ({ lat: cemetery.lat!, lng: cemetery.lng! }));
        if (positions.length) {
          this.mapService.fitBounds(this.map, positions);
        }
      }
    }
  }

  private centerOnUserLocation() {
    if (!this.map || !this.userLocation) {
      return;
    }

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    this.userMarker = this.mapService.addUserMarker(this.map, this.userLocation.lat, this.userLocation.lng);
    this.map.setView([this.userLocation.lat, this.userLocation.lng], 12);
  }

  private async onCemeteryMarkerClick(cemetery: Cemetery, marker: any) {
    const [lng, lat] = cemetery.location.coordinates;
    const destination = { lat, lng };
    const origin = this.userLocation ?? null;

    if (origin) {
      try {
        const route = await this.mapService.renderRoute(this.map, origin, destination);
        const googleUrl = this.mapService.getGoogleMapsDirectionLink(origin, destination, route.transportMode);
        
        // Icone per i mezzi di trasporto
        const transportIcon = this.getTransportIcon(route.transportMode);
        
        // Informazioni sui percorsi aerei con gli aeroporti
        let airportInfo = '';
        if (route.transportMode === 'flying' && route.departureAirport && route.arrivalAirport) {
          airportInfo = `
            <div style="margin:0.75rem 0; padding:0.5rem; background:#f0f0f0; border-radius:6px; font-size:0.9rem;">
              <div><strong>✈️ Aeroporto Partenza:</strong><br/>${route.departureAirport.name} (${route.departureAirport.code})</div>
              <div style="margin-top:0.5rem;"><strong>✈️ Aeroporto Arrivo:</strong><br/>${route.arrivalAirport.name} (${route.arrivalAirport.code})</div>
            </div>
          `;
        }
        
        const content = `
          <div style="max-width:280px; font-family: Arial, sans-serif;">
            <div style="font-size:1rem; font-weight:700; margin-bottom:0.5rem;">${cemetery.name}</div>
            ${cemetery.image ? `<img src="${cemetery.image}" alt="${cemetery.name}" style="width:100%; height:120px; object-fit:cover; border-radius:10px; margin-bottom:0.75rem;"/>` : ''}
            <div style="margin-bottom:0.5rem;">📍 Distanza: <strong>${route.distanceKm.toFixed(1)} km</strong></div>
            <div style="margin-bottom:0.5rem;">${transportIcon} Mezzo: <strong>${this.getTransportLabel(route.transportMode)}</strong></div>
            <div style="margin-bottom:0.75rem;">⏱️ Tempo: <strong>${route.durationText}</strong></div>
            ${airportInfo}
            <a href="${googleUrl}" target="_blank" rel="noopener" style="display:inline-block; background:#007bff; color:#fff; text-decoration:none; padding:0.5rem 0.75rem; border-radius:8px; font-size:0.9rem; width:100%; text-align:center; box-sizing:border-box;">📲 Apri Google Maps</a>
          </div>
        `;
        marker.bindPopup(content).openPopup();
      } catch (error) {
        console.error('Errore nel calcolo del percorso:', error);
        const googleUrl = this.mapService.getGoogleMapsDirectionLink(origin, destination);
        marker.bindPopup(`<strong>${cemetery.name}</strong><br/>Impossibile calcolare il percorso. <br/><a href="${googleUrl}" target="_blank" rel="noopener">Apri Google Maps</a>`).openPopup();
      }
    } else {
      const googleUrl = this.mapService.getGoogleMapsDirectionLink(null, destination);
      marker.bindPopup(`<strong>${cemetery.name}</strong><br/>Imposta prima la tua posizione.<br/><a href="${googleUrl}" target="_blank" rel="noopener">Apri Google Maps</a>`).openPopup();
    }
  }

  /**
   * Ritorna l'icona emoji del mezzo di trasporto
   */
  private getTransportIcon(mode: TransportMode): string {
    switch (mode) {
      case 'flying':
        return '✈️';
      case 'ferry':
        return '⛴️';
      case 'driving':
      default:
        return '🚗';
    }
  }

  /**
   * Ritorna l'etichetta leggibile del mezzo di trasporto
   */
  private getTransportLabel(mode: TransportMode): string {
    switch (mode) {
      case 'flying':
        return 'Aereo';
      case 'ferry':
        return 'Traghetto';
      case 'driving':
      default:
        return 'Auto';
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  closeError() {
    this.errorMessage = '';
  }
}
