import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CemeteryService } from '../../Services/cemetery.service';
import { LeafletMapService, TransportMode, RouteInfo } from '../../Services/leaflet-map.service';
import { GeolocationService } from '../../Services/geolocation.service';

import { NavbarComponent } from '../navbar/navbar.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { MemoriesTimelineComponent } from '../memories-timeline/memories-timeline.component';

import { Cemetery } from '../../Interfaces/Cemetery';
import { Deceased } from '../../Interfaces/Deceased';

@Component({
  selector: 'app-cemetery-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MemoriesTimelineComponent, NavbarComponent, CookieBannerComponent, FooterComponent],
  templateUrl: './cemetery-detail.component.html',
  styleUrls: ['./cemetery-detail.component.scss']
})
export class CemeteryDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  cemetery: Cemetery | undefined;
  allDeceased: Deceased[] = [];
  filteredDeceased: Deceased[] = [];
  selectedDeceased: Deceased | null = null;
  showDeceasedModal = false;
  searchTerm = '';
  aiAnswer = '';
  userPosition: { lat: number; lng: number } | null = null;
  cemeteryDistance: number | undefined;
  cemeteryDuration: string | undefined;
  cemeteryTransportMode: TransportMode = 'driving';
  cemeteryDepartureAirport: any | undefined;
  cemeteryArrivalAirport: any | undefined;

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: any;
  // Salva la posizione Y per ripristinarla alla chiusura
  private scrollY = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private cemeteryService: CemeteryService,
    private mapService: LeafletMapService,
    private geoService: GeolocationService
  ) { }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.geoService.getCurrentPosition()
      .then(pos => {
        this.userPosition = pos;
        if (this.cemetery && this.cemetery.lat !== undefined && this.cemetery.lng !== undefined && this.map) {
          this.mapService.addUserMarker(this.map, pos.lat, pos.lng);
          this.mapService.renderRoute(this.map, pos, { lat: this.cemetery.lat, lng: this.cemetery.lng })
            .then(route => {
              this.cemeteryDistance = route.distanceKm;
              this.cemeteryDuration = route.durationText;
              this.cemeteryTransportMode = route.transportMode;
              this.cemeteryDepartureAirport = route.departureAirport;
              this.cemeteryArrivalAirport = route.arrivalAirport;
            })
            .catch(() => this.cemeteryDistance = this.calculateDistance(pos, this.cemetery!));
        }
      })
      .catch(() => console.log('Geolocalizzazione non disponibile'));

    this.cemeteryService.getCemeteryById(id).subscribe({
      next: (cem) => {
        this.cemetery = cem;

        this.cemeteryService.getDeceasedByCemetery(cem._id!).subscribe({
          next: (deceased) => {
            console.log('Defunti trovati:', deceased);
            this.allDeceased = deceased;
            this.filteredDeceased = [...deceased];
            if (this.allDeceased.length === 0) {
              console.warn('Nessun defunto trovato per questo cimitero');
            }
          },
          error: (err) => {
            console.error('Errore caricamento defunti:', err);
            this.allDeceased = [];
            this.filteredDeceased = [];
          }
        });

        if (this.userPosition) {
          this.cemeteryDistance = this.calculateDistance(this.userPosition, cem);
        }
        setTimeout(() => this.tryInitializeMap(), 100);
      },
      error: (err) => console.error('Errore caricamento cimitero:', err)
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.tryInitializeMap(), 100);
  }

  private async tryInitializeMap() {
    if (!this.cemetery || !this.mapContainer?.nativeElement) return;
    if (this.map) return;

    const { lng, lat } = this.cemetery.location.coordinates;
    this.map = await this.mapService.initMap(this.mapContainer.nativeElement, lat, lng, 15);

    const detailUrl = this.cemetery._id ? `/detail/${this.cemetery._id}` : undefined;
    this.mapService.addMarker(this.map, lat, lng, this.cemetery.name, 'red', detailUrl);

    if (this.userPosition) {
      this.mapService.addUserMarker(this.map, this.userPosition.lat, this.userPosition.lng);
      try {
        const route = await this.mapService.renderRoute(this.map, this.userPosition, { lat, lng });
        this.cemeteryDistance = route.distanceKm;
        this.cemeteryDuration = route.durationText;
        this.cemeteryTransportMode = route.transportMode;
        this.cemeteryDepartureAirport = route.departureAirport;
        this.cemeteryArrivalAirport = route.arrivalAirport;
      } catch (error) {
        console.warn('Impossibile tracciare il percorso:', error);
        this.cemeteryDistance = this.calculateDistance(this.userPosition, this.cemetery);
      }
    }
  }

  private calculateDistance(pos: { lat: number; lng: number }, cem: Cemetery): number {
    const { lng: cemLng, lat: cemLat } = cem.location.coordinates;
    const R = 6371;
    const dLat = (cemLat - pos.lat) * Math.PI / 180;
    const dLng = (cemLng - pos.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos.lat * Math.PI / 180) * Math.cos(cemLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getGoogleMapsLink(): string {
    if (!this.cemetery) return 'https://www.google.com/maps';
    const { lng, lat } = this.cemetery.location.coordinates;
    return this.mapService.getGoogleMapsDirectionLink(this.userPosition, { lat, lng }, this.cemeteryTransportMode);
  }

  searchDeceased() {
    if (!this.searchTerm?.trim()) {
      this.filteredDeceased = [...this.allDeceased];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredDeceased = this.allDeceased.filter(d =>
        d.fullName.toLowerCase().includes(term)
      );
    }
  }

  viewStory(deceased: Deceased) {
    this.selectedDeceased = deceased;

    // ✅ Blocca lo scroll della pagina mantenendo la posizione corrente
    this.scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // evita il layout shift da scrollbar che sparisce

    this.showDeceasedModal = true;

    setTimeout(() => {
      const modal = document.querySelector('.deceased-modal-content');
      if (modal) modal.scrollTop = 0;
    }, 50);
  }

  closeDeceasedModal() {
    this.showDeceasedModal = false;

    // ✅ Ripristina lo scroll esattamente dove era
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    window.scrollTo({ top: this.scrollY, behavior: 'instant' as ScrollBehavior });
  }

  ngOnDestroy() {
    // Pulizia di sicurezza in caso di navigazione con modale aperto
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
  }
}