import { Injectable } from '@angular/core';
import * as L from 'leaflet';

interface LatLng {
  lat: number;
  lng: number;
}

interface Airport {
  name: string;
  code: string;
  lat: number;
  lng: number;
  region: string;
}

export type TransportMode = 'driving' | 'flying' | 'ferry';

export interface RouteInfo {
  distanceKm: number;
  durationText: string;
  transportMode: TransportMode;
  departureAirport?: Airport;
  arrivalAirport?: Airport;
}

@Injectable({ providedIn: 'root' })
export class LeafletMapService {
  private currentRoute: L.FeatureGroup | null = null;
  private osrmBaseUrl = 'https://router.project-osrm.org';
  
  // GeoJSON di oceani e grandi masse d'acqua (semplificate)
  private oceanBoundaries = this.getOceanBoundaries();
  
  // Lista principale di aeroporti europei e mondiali
  private airports: Airport[] = this.getAirportDatabase();

  initMap(container: string | HTMLElement, lat: number, lng: number, zoom = 18): Promise<any> {
    return new Promise((resolve) => {
      this.configureIconDefaults();

      const map = L.map(container as HTMLElement, {
        center: [lat, lng],
        zoom,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 100);
      resolve(map);
    });
  }

  addMarker(map: any, lat: number, lng: number, popupText: string, color = 'red', detailUrl?: string) {
    const marker = this.createMarker(lat, lng, popupText, color, detailUrl);
    marker.addTo(map);
    return marker;
  }

  private createMarker(lat: number, lng: number, popupText: string, color = 'red', detailUrl?: string) {
    const iconUrl = this.getMarkerIconUrl(color);
    const icon = L.icon({
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      shadowSize: [41, 41]
    });

    const marker = L.marker([lat, lng], { icon });
    if (detailUrl) {
      marker.bindPopup(`<strong>${popupText}</strong><br/><a href="${detailUrl}" style="color:#1a73e8; text-decoration:none;">Vai ai dettagli</a>`);
    } else {
      marker.bindPopup(popupText);
    }

    return marker;
  }

  addUserMarker(map: any, lat: number, lng: number) {
    const icon = L.divIcon({
      className: 'user-location-marker',
      html: `<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='16' cy='16' r='12' fill='#4a90e2' opacity='0.3'/>
          <circle cx='16' cy='16' r='8' fill='#4a90e2' opacity='0.6'/>
          <circle cx='16' cy='16' r='4' fill='#ffffff' stroke='#4a90e2' stroke-width='2'/>
        </svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    return L.marker([lat, lng], { icon }).addTo(map).bindPopup('La tua posizione');
  }

  async renderRoute(map: any, origin: LatLng, destination: LatLng): Promise<RouteInfo> {
    if (this.currentRoute) {
      map.removeLayer(this.currentRoute);
      this.currentRoute = null;
    }

    // Determina il mezzo di trasporto più appropriato
    const transportMode = await this.determineTransportMode(origin, destination);
    
    let routeInfo: RouteInfo;
    
    if (transportMode === 'driving') {
      routeInfo = await this.getCarRoute(origin, destination);
    } else if (transportMode === 'flying') {
      routeInfo = this.getAirRoute(origin, destination);
    } else {
      routeInfo = this.getFerryRoute(origin, destination);
    }

    // Visualizza il percorso sulla mappa
    const coordinates = await this.getRouteCoordinates(
      origin, 
      destination, 
      transportMode,
      routeInfo.departureAirport,
      routeInfo.arrivalAirport
    );
    if (coordinates.length > 0) {
      const routePolyline = L.polyline(coordinates, { 
        color: this.getColorByTransport(transportMode), 
        weight: 7, 
        opacity: 0.85,
        dashArray: transportMode !== 'driving' ? '10,5' : undefined
      });
      const routeGroup = L.featureGroup([routePolyline]).addTo(map);

      // Aggiungi marcatori per gli aeroporti nel caso di volo
      if (transportMode === 'flying' && routeInfo.departureAirport && routeInfo.arrivalAirport) {
        const deptMarker = this.createMarker(
          routeInfo.departureAirport.lat,
          routeInfo.departureAirport.lng,
          `Aeroporto di partenza\n${routeInfo.departureAirport.code} - ${routeInfo.departureAirport.name}`,
          'orange'
        );
        deptMarker.addTo(map);
        routeGroup.addLayer(deptMarker);

        const arrMarker = this.createMarker(
          routeInfo.arrivalAirport.lat,
          routeInfo.arrivalAirport.lng,
          `Aeroporto di arrivo\n${routeInfo.arrivalAirport.code} - ${routeInfo.arrivalAirport.name}`,
          'green'
        );
        arrMarker.addTo(map);
        routeGroup.addLayer(arrMarker);
      }

      const routeEnd = L.latLng(coordinates[coordinates.length - 1]);
      const destinationLatLng = L.latLng(destination.lat, destination.lng);
      if (destinationLatLng.distanceTo(routeEnd) > 30) {
        const connector = L.polyline([routeEnd, destinationLatLng], {
          color: '#ff6b6b',
          weight: 4,
          opacity: 0.7,
          dashArray: '12,8'
        });
        connector.addTo(routeGroup);
      }

      this.currentRoute = routeGroup;
      const bounds = routeGroup.getBounds();
      map.fitBounds(bounds, { padding: [70, 70] });
    }

    return routeInfo;
  }

  getGoogleMapsDirectionLink(origin: LatLng | null, destination: LatLng, transportMode: TransportMode = 'driving'): string {
    const destinationParam = `${destination.lat},${destination.lng}`;
    const travelModeParam = this.mapTransportModeToGoogle(transportMode);
    
    if (!origin) {
      return `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=${travelModeParam}`;
    }

    const originParam = `${origin.lat},${origin.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=${travelModeParam}`;
  }

  async getRouteDistances(origin: LatLng, destinations: LatLng[]): Promise<number[]> {
    if (!destinations.length) {
      return [];
    }

    const coords = [origin, ...destinations].map(loc => `${loc.lng},${loc.lat}`).join(';');
    const destinationsIndex = destinations.map((_, index) => index + 1).join(';');
    const url = `${this.osrmBaseUrl}/table/v1/driving/${coords}?sources=0&destinations=${destinationsIndex}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.distances || !Array.isArray(data.distances[0])) {
      return destinations.map((destination) => this.calculateDistance(origin, destination));
    }

    return data.distances[0].map((distance: number, index: number) => {
      if (distance == null || distance === Infinity) {
        return this.calculateDistance(origin, destinations[index]);
      }
      return distance / 1000;
    });
  }

  fitBounds(map: any, positions: LatLng[]) {
    if (!positions.length) {
      return;
    }

    const bounds = L.latLngBounds(positions.map(pos => [pos.lat, pos.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [70, 70] });
  }

  private calculateDistance(origin: LatLng, destination: LatLng): number {
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }

  private getMarkerIconUrl(color: string): string {
    const colorMap: { [key: string]: string } = {
      red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      green: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      orange: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      yellow: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      violet: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
      grey: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
      black: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png'
    };
    return colorMap[color] || colorMap['red'];
  }

  private configureIconDefaults() {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  }

  // ==================== METODI DI ROUTING MULTI-MODALE ====================

  /**
   * Determina il mezzo di trasporto più appropriato in base alla distanza e geografica
   */
  private async determineTransportMode(origin: LatLng, destination: LatLng): Promise<TransportMode> {
    const distance = this.calculateDistance(origin, destination);
    
    // Se il percorso attraversa oceani o è molto lontano, usa aereo
    if (this.isCrossOcean(origin, destination) || distance > 1500) {
      return 'flying';
    }
    
    // Se vicino a oceani ma percorribile via terra, controlla se c'è una rotta terrestre
    if (distance > 300 && this.isNearCoastalArea(origin, destination)) {
      return 'ferry';
    }
    
    return 'driving';
  }

  /**
   * Percorso in auto usando OSRM
   */
  private async getCarRoute(origin: LatLng, destination: LatLng): Promise<RouteInfo> {
    const url = `${this.osrmBaseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&annotations=distance,duration`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.routes?.length) {
        throw new Error('Impossibile ottenere il percorso');
      }

      const route = data.routes[0];
      return {
        distanceKm: route.distance / 1000,
        durationText: this.formatDuration(route.duration),
        transportMode: 'driving'
      };
    } catch (error) {
      // Fallback a calcolo lineare
      const distance = this.calculateDistance(origin, destination);
      const estimatedTimeHours = distance / 80; // Media circa 80 km/h in auto
      return {
        distanceKm: distance,
        durationText: this.formatDuration(estimatedTimeHours * 3600),
        transportMode: 'driving'
      };
    }
  }

  /**
   * Percorso aereo (linea retta con tempi realistici)
   * Include il percorso stradale verso l'aeroporto di partenza
   */
  private getAirRoute(origin: LatLng, destination: LatLng): RouteInfo {
    // Trova gli aeroporti più vicini
    const departureAirport = this.findNearestAirport(origin);
    const arrivalAirport = this.findNearestAirport(destination);
    
    // Calcola distanza effettiva del volo (tra aeroporti)
    const flightDistance = this.calculateDistance(
      { lat: departureAirport.lat, lng: departureAirport.lng },
      { lat: arrivalAirport.lat, lng: arrivalAirport.lng }
    );
    
    // Calcola distanza dalla posizione utente all'aeroporto
    const roadToAirportDistance = this.calculateDistance(origin, { 
      lat: departureAirport.lat, 
      lng: departureAirport.lng 
    });
    
    // Tempo totale: guida + check-in + volo + ritiro + transfer
    // Guida: 80 km/h + Check-in: 2h + Volo: flightDistance/900 + Ritiro: 1h + Transfer: 30 min
    const drivingTimeHours = roadToAirportDistance / 80;
    const flightHours = flightDistance / 900;
    const totalHours = drivingTimeHours + 2 + flightHours + 1 + 0.5;
    
    const totalMinutes = Math.round(totalHours * 60);
    
    // Distanza totale: strada + rotta aerea
    const totalDistance = roadToAirportDistance + flightDistance;
    
    return {
      distanceKm: totalDistance,
      durationText: `${Math.round(totalHours)}h ${totalMinutes % 60}m (strada + volo)`,
      transportMode: 'flying',
      departureAirport,
      arrivalAirport
    };
  }

  /**
   * Percorso in traghetto (linea retta con tempi realistici)
   */
  private getFerryRoute(origin: LatLng, destination: LatLng): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    
    // Estima: velocità media traghetto 30 km/h + preparazione (2 ore)
    const ferryHours = (distance / 30) + 2;
    const ferryMinutes = Math.round(ferryHours * 60);
    
    return {
      distanceKm: distance,
      durationText: `${Math.round(ferryHours)}h ${ferryMinutes % 60}m (traghetto)`,
      transportMode: 'ferry'
    };
  }

  /**
   * Ottiene le coordinate del percorso in base al mezzo
   * Per i voli, include il percorso stradale verso l'aeroporto di partenza + rotta aerea
   */
  private async getRouteCoordinates(
    origin: LatLng, 
    destination: LatLng, 
    transportMode: TransportMode,
    departureAirport?: Airport,
    arrivalAirport?: Airport
  ): Promise<[number, number][]> {
    if (transportMode === 'driving') {
      return await this.getDrivingRouteCoordinates(origin, destination);
    } else if (transportMode === 'flying' && departureAirport && arrivalAirport) {
      // Per voli: percorso stradale verso aeroporto + rotta aerea
      return await this.getCompositeAirRoute(origin, destination, departureAirport, arrivalAirport);
    } else if (transportMode === 'flying') {
      // Fallback: solo grande cerchio
      return this.getGreatCircleRoute(origin, destination, 50);
    } else {
      // Per traghetto, linea retta con alcuni waypoint verso la costa
      return this.getCoastalRoute(origin, destination, 30);
    }
  }

  /**
   * Ottiene le coordinate del percorso stradale da OSRM
   */
  private async getDrivingRouteCoordinates(origin: LatLng, destination: LatLng): Promise<[number, number][]> {
    const url = `${this.osrmBaseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.routes?.[0]?.geometry?.coordinates) {
        return data.routes[0].geometry.coordinates.map((coord: [number, number]) => 
          [coord[1], coord[0]] as [number, number]
        );
      }
    } catch (error) {
      console.warn('Errore recupero coordinate percorso stradale:', error);
    }

    // Fallback: linea retta
    return [[origin.lat, origin.lng], [destination.lat, destination.lng]];
  }

  /**
   * Genera il percorso composito per i voli:
   * - Percorso stradale dall'origine all'aeroporto di partenza
   * - Rotta aerea dall'aeroporto di partenza all'aeroporto di arrivo
   * - Percorso stradale dall'aeroporto di arrivo alla destinazione
   */
  private async getCompositeAirRoute(
    origin: LatLng,
    destination: LatLng,
    departureAirport: Airport,
    arrivalAirport: Airport
  ): Promise<[number, number][]> {
    const compositeRoute: [number, number][] = [];

    try {
      // 1. Percorso stradale: origine → aeroporto partenza
      const roadToDeparture = await this.getDrivingRouteCoordinates(
        origin,
        { lat: departureAirport.lat, lng: departureAirport.lng }
      );
      compositeRoute.push(...roadToDeparture);

      // 2. Rotta aerea: aeroporto partenza → aeroporto arrivo (great circle)
      const airRoute = this.getGreatCircleRoute(
        { lat: departureAirport.lat, lng: departureAirport.lng },
        { lat: arrivalAirport.lat, lng: arrivalAirport.lng },
        100 // Più punti per rotta lunga
      );
      
      // Aggiungi la rotta aerea (saltando il primo punto per evitare duplicati)
      compositeRoute.push(...airRoute.slice(1));

      // 3. Percorso stradale: aeroporto arrivo → destinazione
      const roadToDestination = await this.getDrivingRouteCoordinates(
        { lat: arrivalAirport.lat, lng: arrivalAirport.lng },
        destination
      );
      
      // Aggiungi il percorso di arrivo (saltando il primo punto per evitare duplicati)
      compositeRoute.push(...roadToDestination.slice(1));

      return compositeRoute;
    } catch (error) {
      console.warn('Errore nel calcolo del percorso composito:', error);
      
      // Fallback: ritorna la rotta aerea diretta
      return this.getGreatCircleRoute(origin, destination, 50);
    }
  }

  /**
   * Genera una rotta di great circle (percorso aereo)
   */
  private getGreatCircleRoute(origin: LatLng, destination: LatLng, points = 50): [number, number][] {
    const route: [number, number][] = [];
    
    for (let i = 0; i <= points; i++) {
      const f = i / points;
      const A = Math.sin((1 - f) * this.toRad(this.computeDistance(origin, destination))) / Math.sin(this.toRad(this.computeDistance(origin, destination)));
      const B = Math.sin(f * this.toRad(this.computeDistance(origin, destination))) / Math.sin(this.toRad(this.computeDistance(origin, destination)));

      const x = A * Math.cos(this.toRad(origin.lat)) * Math.cos(this.toRad(origin.lng)) + 
                B * Math.cos(this.toRad(destination.lat)) * Math.cos(this.toRad(destination.lng));
      const y = A * Math.cos(this.toRad(origin.lat)) * Math.sin(this.toRad(origin.lng)) + 
                B * Math.cos(this.toRad(destination.lat)) * Math.sin(this.toRad(destination.lng));
      const z = A * Math.sin(this.toRad(origin.lat)) + B * Math.sin(this.toRad(destination.lat));

      const lat = this.toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
      const lng = this.toDeg(Math.atan2(y, x));

      route.push([lat, lng]);
    }

    return route;
  }

  /**
   * Genera una rotta costiera (traghetto)
   */
  private getCoastalRoute(origin: LatLng, destination: LatLng, points = 30): [number, number][] {
    const route: [number, number][] = [];
    
    for (let i = 0; i <= points; i++) {
      const f = i / points;
      const lat = origin.lat + (destination.lat - origin.lat) * f + (Math.sin(f * Math.PI) * 0.05); // Leggermente curva
      const lng = origin.lng + (destination.lng - origin.lng) * f;
      route.push([lat, lng]);
    }

    return route;
  }

  /**
   * Rileva se il percorso attraversa oceani
   */
  private isCrossOcean(origin: LatLng, destination: LatLng): boolean {
    // Verifica semplice: se la distanza diretta è molto maggiore della distanza stradale
    // Per ora usiamo una lista di oceani noti
    
    const oceanAreas = [
      // Oceano Atlantico
      { minLat: 0, maxLat: 70, minLng: -80, maxLng: -10 },
      // Oceano Pacifico
      { minLat: -60, maxLat: 60, minLng: 100, maxLng: 180 },
      { minLat: -60, maxLat: 60, minLng: -180, maxLng: -100 },
      // Oceano Indiano
      { minLat: -60, maxLat: 30, minLng: 30, maxLng: 100 },
    ];

    // Controlla se la rotta passa attraverso aree oceaniche
    for (const area of oceanAreas) {
      if (this.lineIntersectsArea(origin, destination, area)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Rileva se il percorso è vicino a zone costiere
   */
  private isNearCoastalArea(origin: LatLng, destination: LatLng): boolean {
    const coastalAreas = [
      // Mediterraneo
      { minLat: 30, maxLat: 46, minLng: -5, maxLng: 42 },
      // Mar del Nord
      { minLat: 50, maxLat: 60, minLng: -3, maxLng: 10 },
      // Mar Baltico
      { minLat: 53, maxLat: 66, minLng: 10, maxLng: 30 },
      // Caraibi
      { minLat: 10, maxLat: 27, minLng: -86, maxLng: -60 },
    ];

    for (const area of coastalAreas) {
      if (this.lineIntersectsArea(origin, destination, area)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Controlla se una linea interseca un'area rettangolare
   */
  private lineIntersectsArea(
    origin: LatLng, 
    destination: LatLng, 
    area: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  ): boolean {
    // Controlla se la linea passa nei pressi dell'area
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    return (midLat >= area.minLat && midLat <= area.maxLat &&
            midLng >= area.minLng && midLng <= area.maxLng);
  }

  /**
   * Calcola la distanza angolare tra due punti (per great circle)
   */
  private computeDistance(origin: LatLng, destination: LatLng): number {
    const dLat = destination.lat - origin.lat;
    const dLng = destination.lng - origin.lng;
    const a = Math.sin(this.toRad(dLat) / 2) * Math.sin(this.toRad(dLat) / 2) +
              Math.cos(this.toRad(origin.lat)) * Math.cos(this.toRad(destination.lat)) *
              Math.sin(this.toRad(dLng) / 2) * Math.sin(this.toRad(dLng) / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.toDeg(c);
  }

  /**
   * Converte gradi a radianti
   */
  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  /**
   * Converte radianti a gradi
   */
  private toDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }

  /**
   * Mappa il mezzo di trasporto ai parametri di Google Maps
   */
  private mapTransportModeToGoogle(mode: TransportMode): string {
    switch (mode) {
      case 'flying':
        return 'transit'; // Google Maps non ha volo diretto, usiamo transit come approssimazione
      case 'ferry':
        return 'driving'; // Traghetto + strada
      case 'driving':
      default:
        return 'driving';
    }
  }

  /**
   * Restituisce il colore della linea based sul mezzo di trasporto
   */
  private getColorByTransport(mode: TransportMode): string {
    switch (mode) {
      case 'flying':
        return '#df4601'; // Arancione per volo
      case 'ferry':
        return '#0066cc'; // Blu per traghetto
      case 'driving':
      default:
        return '#007bff'; // Azzurro per auto
    }
  }

  /**
   * Restituisce i dati dei confini oceanici
   */
  private getOceanBoundaries(): any[] {
    return []; // Verrà utilizzato quando necessario per geometrie più precise
  }

  /**
   * Trova l'aeroporto più vicino a una determinata posizione
   */
  private findNearestAirport(position: LatLng): Airport {
    // Se non ci sono aeroporti, ritorna un default (Roma Fiumicino)
    if (!this.airports || this.airports.length === 0) {
      this.airports = this.getAirportDatabase();
    }

    let nearestAirport = this.airports[0];
    let minDistance = this.calculateDistance(position, {
      lat: nearestAirport.lat,
      lng: nearestAirport.lng
    });

    for (let i = 1; i < this.airports.length; i++) {
      const airport = this.airports[i];
      const distance = this.calculateDistance(position, {
        lat: airport.lat,
        lng: airport.lng
      });

      if (distance < minDistance) {
        minDistance = distance;
        nearestAirport = airport;
      }
    }

    return nearestAirport;
  }

  /**
   * Database degli aeroporti principali mondiali
   */
  private getAirportDatabase(): Airport[] {
    return [
      // EUROPA
      { name: 'Leonardo da Vinci - Fiumicino', code: 'FCO', lat: 41.8002, lng: 12.2388, region: 'Italia' },
      { name: 'Ciampino', code: 'CIA', lat: 41.7994, lng: 12.5949, region: 'Italia' },
      { name: 'Malpensa', code: 'MXP', lat: 45.6306, lng: 8.7281, region: 'Italia' },
      { name: 'Linate', code: 'LIN', lat: 45.4626, lng: 9.2711, region: 'Italia' },
      { name: 'Marco Polo', code: 'VCE', lat: 45.5050, lng: 12.3518, region: 'Italia' },
      { name: 'Orio al Serio', code: 'BGY', lat: 45.6729, lng: 9.7081, region: 'Italia' },
      { name: 'Palermo', code: 'PMO', lat: 37.6213, lng: 13.0911, region: 'Italia' },
      { name: 'Napoli', code: 'NAP', lat: 40.8856, lng: 14.2910, region: 'Italia' },
      { name: 'Genova', code: 'GOA', lat: 44.4124, lng: 8.8366, region: 'Italia' },
      { name: 'Firenze', code: 'FLR', lat: 43.8095, lng: 11.2051, region: 'Italia' },
      
      { name: 'Charles de Gaulle', code: 'CDG', lat: 49.0097, lng: 2.5479, region: 'Francia' },
      { name: 'Orly', code: 'ORY', lat: 48.7233, lng: 2.3793, region: 'Francia' },
      { name: 'Lyon', code: 'LYS', lat: 45.7262, lng: 5.0907, region: 'Francia' },
      { name: 'Marsiglia', code: 'MRS', lat: 43.4426, lng: 5.2219, region: 'Francia' },
      
      { name: 'Barcelona El Prat', code: 'BCN', lat: 41.2974, lng: 2.0833, region: 'Spagna' },
      { name: 'Madrid Barajas', code: 'MAD', lat: 40.4719, lng: -3.6289, region: 'Spagna' },
      { name: 'Malaga', code: 'AGP', lat: 36.6699, lng: -3.7385, region: 'Spagna' },
      { name: 'Valencia', code: 'VLC', lat: 39.4891, lng: -0.4814, region: 'Spagna' },
      
      { name: 'Lisboa', code: 'LIS', lat: 38.6821, lng: -9.1393, region: 'Portogallo' },
      { name: 'Porto', code: 'OPO', lat: 41.2411, lng: -8.6417, region: 'Portogallo' },
      
      { name: 'Monaco', code: 'NCE', lat: 43.6584, lng: 7.2159, region: 'Francia' },
      { name: 'Atene', code: 'ATH', lat: 37.9364, lng: 23.9445, region: 'Grecia' },
      { name: 'Istanbul', code: 'IST', lat: 41.2619, lng: 28.7458, region: 'Turchia' },
      { name: 'Vienna', code: 'VIE', lat: 48.1101, lng: 16.5697, region: 'Austria' },
      { name: 'Praga', code: 'PRG', lat: 50.1008, lng: 14.2600, region: 'Repubblica Ceca' },
      { name: 'Berlino Brandenburg', code: 'BER', lat: 52.3667, lng: 13.5033, region: 'Germania' },
      { name: 'Monaco di Baviera', code: 'MUC', lat: 48.3538, lng: 11.7861, region: 'Germania' },
      { name: 'Amsterdam', code: 'AMS', lat: 52.3086, lng: 4.7639, region: 'Olanda' },
      { name: 'Londra Heathrow', code: 'LHR', lat: 51.4700, lng: -0.4543, region: 'UK' },
      { name: 'Londra Gatwick', code: 'LGW', lat: 51.1537, lng: -0.1821, region: 'UK' },
      { name: 'Manchester', code: 'MAN', lat: 53.3537, lng: -2.2750, region: 'UK' },
      { name: 'Mosca Sheremetyevo', code: 'SVO', lat: 55.9729, lng: 37.4146, region: 'Russia' },
      
      // NORD AFRICA
      { name: 'Casablanca', code: 'CMN', lat: 33.3675, lng: -7.5937, region: 'Marocco' },
      { name: 'Tunisi', code: 'TUN', lat: 36.8515, lng: 10.2272, region: 'Tunisia' },
      { name: 'Algeri', code: 'ALG', lat: 36.6914, lng: 3.2156, region: 'Algeria' },
      
      // AMERICA DEL NORD
      { name: 'New York JFK', code: 'JFK', lat: 40.6413, lng: -73.7781, region: 'USA' },
      { name: 'New York Newark', code: 'EWR', lat: 40.6895, lng: -74.1745, region: 'USA' },
      { name: 'Boston', code: 'BOS', lat: 42.3656, lng: -71.0096, region: 'USA' },
      { name: 'Washington DC', code: 'IAD', lat: 38.8951, lng: -77.0369, region: 'USA' },
      { name: 'Miami', code: 'MIA', lat: 25.7959, lng: -80.2871, region: 'USA' },
      { name: 'Chicago', code: 'ORD', lat: 41.9742, lng: -87.9073, region: 'USA' },
      { name: 'Los Angeles', code: 'LAX', lat: 33.9425, lng: -118.4081, region: 'USA' },
      { name: 'San Francisco', code: 'SFO', lat: 37.6213, lng: -122.3790, region: 'USA' },
      { name: 'Seattle', code: 'SEA', lat: 47.4502, lng: -122.3088, region: 'USA' },
      { name: 'Dallas', code: 'DFW', lat: 32.8975, lng: -97.0381, region: 'USA' },
      { name: 'Houston', code: 'IAH', lat: 29.9902, lng: -95.3368, region: 'USA' },
      { name: 'Denver', code: 'DEN', lat: 39.8561, lng: -104.6737, region: 'USA' },
      { name: 'Las Vegas', code: 'LAS', lat: 36.0840, lng: -115.1537, region: 'USA' },
      { name: 'Phoenix', code: 'PHX', lat: 33.4342, lng: -112.0116, region: 'USA' },
      { name: 'Toronto', code: 'YYZ', lat: 43.6777, lng: -79.6248, region: 'Canada' },
      { name: 'Vancouver', code: 'YVR', lat: 49.1900, lng: -123.1794, region: 'Canada' },
      { name: 'Messico City', code: 'MEX', lat: 19.4326, lng: -99.0731, region: 'Messico' },
      
      // CARAIBI
      { name: 'San Juan', code: 'SJU', lat: 18.4386, lng: -66.1793, region: 'Porto Rico' },
      { name: 'Cancun', code: 'CUN', lat: 20.6295, lng: -87.0739, region: 'Messico' },
      { name: 'Nassau', code: 'NAS', lat: 25.0333, lng: -77.4667, region: 'Bahamas' },
      
      // AMERICA DEL SUD
      { name: 'San Paolo', code: 'GIG', lat: -22.9068, lng: -43.1729, region: 'Brasile' },
      { name: 'Rio de Janeiro', code: 'GIG', lat: -22.8062, lng: -43.2439, region: 'Brasile' },
      { name: 'Buenos Aires', code: 'EZE', lat: -34.8222, lng: -58.5358, region: 'Argentina' },
      { name: 'Lima', code: 'LIM', lat: -12.0219, lng: -77.1084, region: 'Peru' },
      { name: 'Bogota', code: 'BOG', lat: 4.7017, lng: -74.1469, region: 'Colombia' },
      
      // ASIA
      { name: 'Hong Kong', code: 'HKG', lat: 22.3080, lng: 113.9185, region: 'Hong Kong' },
      { name: 'Shanghai Pudong', code: 'PVG', lat: 31.1434, lng: 121.8047, region: 'Cina' },
      { name: 'Pechino', code: 'PEI', lat: 40.0801, lng: 116.5847, region: 'Cina' },
      { name: 'Tokyo Narita', code: 'NRT', lat: 35.7653, lng: 140.3931, region: 'Giappone' },
      { name: 'Tokyo Haneda', code: 'HND', lat: 35.5494, lng: 139.7798, region: 'Giappone' },
      { name: 'Bangkok', code: 'BKK', lat: 13.6923, lng: 100.7501, region: 'Tailandia' },
      { name: 'Singapore', code: 'SIN', lat: 1.3521, lng: 103.8198, region: 'Singapore' },
      { name: 'Kuala Lumpur', code: 'KUL', lat: 2.7258, lng: 101.7103, region: 'Malesia' },
      { name: 'Mumbai', code: 'BOM', lat: 19.0881, lng: 72.8678, region: 'India' },
      { name: 'Nuova Delhi', code: 'DEL', lat: 28.5565, lng: 77.1001, region: 'India' },
      { name: 'Dubai', code: 'DXB', lat: 25.2528, lng: 55.3644, region: 'Emirati Arabi' },
      { name: 'Bangkok', code: 'DMK', lat: 13.9125, lng: 100.6097, region: 'Tailandia' },
      { name: 'Seoul', code: 'ICN', lat: 37.4602, lng: 126.4407, region: 'Corea del Sud' },
      
      // AUSTRALIA/OCEANIA
      { name: 'Sydney', code: 'SYD', lat: -33.9461, lng: 151.1772, region: 'Australia' },
      { name: 'Melbourne', code: 'MEL', lat: -37.6733, lng: 144.8410, region: 'Australia' },
      { name: 'Auckland', code: 'AKL', lat: -37.0082, lng: 174.7850, region: 'Nuova Zelanda' },
    ];
  }
}
