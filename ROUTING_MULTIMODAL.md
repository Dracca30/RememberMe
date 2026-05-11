# Sistema di Routing Multi-Modale 🗺️

## Panoramica

È stato implementato un **sistema di routing intelligente multi-modale** che seleziona automaticamente il mezzo di trasporto più appropriato (auto, aereo, traghetto) in base alla distanza e alla geografia del percorso.

### ✨ Principale Caratteristica Aggiornamento
**NUOVA FUNZIONALITÀ**: Quando si seleziona l'aereo, il sistema mostra:
1. 🚗 Percorso stradale dall'**origine all'aeroporto più vicino**
2. ✈️ Rotta aerea dall'**aeroporto di partenza all'aeroporto di arrivo**
3. 🚗 Percorso stradale dall'**aeroporto di arrivo alla destinazione**

Gli aeroporti più vicini vengono automaticamente rilevati da un **database di 60+ aeroporti mondiali**.

## Funzionalità Principali

### 1. **Selezione Intelligente del Mezzo di Trasporto**

Il sistema determina automaticamente il miglior mezzo di trasporto:

- **🚗 Auto (Driving)**: Per percorsi terrestri fino a 300 km
  - Usa OSRM per calcoli realistici
  - Velocità media: ~80 km/h
  
- **✈️ Aereo (Flying)**: Per percorsi > 1500 km o che attraversano oceani
  - Percorso stradale: origine → aeroporto partenza
  - Rotta aerea: grande cerchio con 100 punti
  - Percorso stradale: aeroporto arrivo → destinazione
  - Tempo stimato: (guida a aeroporto) + 2h check-in + (volo) + 1h ritiro + 30m transfer
  
- **⛴️ Traghetto (Ferry)**: Per percorsi costieri (300-1500 km)
  - Tempo stimato: (distanza / 30 km/h) + 2 ore (preparazione)
  - Rotta leggermente curva verso la costa

### 2. **Sistema degli Aeroporti**

#### Database Integrato
- 60+ aeroporti principali mondiali
- Copertura di: Europa, Africa, America, Asia, Oceania
- Coordinate reali e codici IATA

#### Rilevamento Automatico
- `findNearestAirport()`: Trova l'aeroporto più vicino usando distanza Haversine
- Supporta percorsi internazionali su rotte oceaniche

#### Aeroporti Inclusi
**Italia**: 
- Roma (FCO, CIA), Milano (MXP, LIN), Venezia, Bergamo, Palermo, Napoli, Genova, Firenze

**Europa**:
- Paris (CDG, ORY), Barcelona (BCN), Madrid (MAD), London (LHR, LGW)
- Berlin (BER), Vienna (VIE), Amsterdam (AMS), Prague (PRG)
- Athens (ATH), Istanbul (IST), Moscow (SVO)

**Resto del Mondo**:
- USA: New York (JFK, EWR), Los Angeles (LAX), Chicago (ORD), Boston (BOS), Miami (MIA)
- Canada: Toronto (YYZ), Vancouver (YVR)
- America Latina: San Paolo (GIG), Buenos Aires (EZE), Lima (LIM), Bogota (BOG)
- Asia: Hong Kong (HKG), Shanghai (PVG), Tokyo (HND), Bangkok (BKK), Singapore (SIN), Dubai (DXB), Seoul (ICN)
- Australia/Oceania: Sydney (SYD), Melbourne (MEL), Auckland (AKL)
- Caraibi: San Juan (SJU), Cancun (CUN), Nassau (NAS)

### 3. **Percorso Composito per Voli**

#### Algoritmo
```
1. Caccia di arrivo → Aeroporto Partenza (OSRM stradale)
   ↓
2. Aeroporto Partenza → Aeroporto Arrivo (Great Circle Route)
   ↓
3. Aeroporto Arrivo → Destinazione (OSRM stradale)
```

#### Metodo: `getCompositeAirRoute()`
- Combina 3 segmenti di percorso
- Evita duplicati di coordinate (slice(1))
- Fallback robusto se OSRM non disponibile

### 4. **Rilevamento Geografico Automatico**

Il sistema rileva automaticamente:
- **Oceani Maggiori**: Atlantico, Pacifico, Indiano
- **Mari Costieri**: Mediterraneo, Mar del Nord, Baltico, Caraibi
- **Intersezione di rotte**: Verifica se il percorso passa attraverso zone d'acqua

### 5. **Integrazione con Google Maps**

Quando l'utente clicca su "Apri Google Maps":
- Il mezzo di trasporto selezionato viene passato come parametro
- Google Maps apre con la rotta pre-configurata
- Supporto per: `driving`, `transit`, `walking`, `bicycling`

### 6. **Visualizzazione sulla Mappa**

I percorsi sono visualizzati con stili differenti:
- **Blu azzurro** (#007bff): Auto (linea continua)
- **Arancione** (#df4601): Aereo (linea tratteggiata)
- **Blu scuro** (#0066cc): Traghetto (linea tratteggiata)

Per i voli, i colori differenti indicano i 3 segmenti:
1. **Blu azzurro**: Stradale verso aeroporto
2. **Arancione tratteggiato**: Rotta aerea
3. **Blu azzurro**: Stradale dall'aeroporto

### 7. **Informazioni degli Aeroporti nei Popup**

Quando si clicca su un cimitero sulla mappa (per i voli):
```
┌─────────────────────────┐
│  Nome Cimitero          │
│  [Immagine]             │
│  📍 Distanza: X km      │
│  ✈️ Mezzo: Aereo        │
│  ⏱️ Tempo: XXh XXm      │
│  ┌──────────────────┐   │
│  │ ✈️ Aer.Partenza  │   │
│  │ FCO - Roma       │   │
│  │                  │   │
│  │ ✈️ Aer.Arrivo    │   │
│  │ JFK - New York   │   │
│  └──────────────────┘   │
│  📲 Apri Google Maps    │
└─────────────────────────┘
```

## File Modificati

### 1. **leaflet-map.service.ts** (+400 righe)
```typescript
// Nuove interfacce
interface Airport {
  name: string;
  code: string;
  lat: number;
  lng: number;
  region: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationText: string;
  transportMode: TransportMode;
  departureAirport?: Airport;
  arrivalAirport?: Airport;
}

// Metodi principali NUOVI
- findNearestAirport(): Trova aeroporto più vicino
- getAirportDatabase(): Database 60+ aeroporti
- getCompositeAirRoute(): Combina 3 segmenti percorso
- getAirRoute() [AGGIORNATO]: Ora calcola tempo totale con aeroporti

// Metodi modificati
- getRouteCoordinates() [AGGIORNATO]: Supporta parametri aeroporto
```

### 2. **cemetery-detail.component.ts**
- Aggiunta proprietà `cemeteryDepartureAirport` e `cemeteryArrivalAirport`
- Aggiornamiento dei metodi renderRoute per memorizzare aeroporti

### 3. **cemetery-detail.component.html**
- Visualizzazione info aeroporti in alert-info box
- Mostrato solo quando transportMode è 'flying'

### 4. **map-fullscreen.component.ts**
- Aggiunto `airportInfo` nel popup
- Visualizzazione nome, codice e città aeroporto

### 5. **map-fullscreen.component.html**
- Popup dinamico con dettagli degli aeroporti
- Info inclusa in background grigio

## Esempi di Utilizzo

### Scenario 1: Percorso in Auto (es. Roma → Firenze)
```
Distanza: 280 km (stradale)
Mezzo: 🚗 Auto
Tempo: 3h 30m
URL Google Maps: ...&travelmode=driving
```

### Scenario 2: Percorso in Aereo (es. Roma → New York)
```
Distanza: 6200 km (280 km stradale + 5920 km aereo + 100 km stradale)
Mezzo: ✈️ Aereo
Tempo: 
  - Guida a FCO: 35 min
  - Check-in + imbarco: 2h
  - Volo FCO → JFK: 8h 20m
  - Ritiro + transfer: 1h 30m
  Totale: ~12h 25m

Aeroporti:
  ✈️ Partenza: Leonardo da Vinci - Fiumicino (FCO)
  ✈️ Arrivo: New York JFK (JFK)

URL Google Maps: ...&travelmode=transit
```

### Scenario 3: Percorso in Traghetto (es. Barcelona → Palma)
```
Distanza: 150 km (marino)
Mezzo: ⛴️ Traghetto
Tempo: 5h 30m
URL Google Maps: ...&travelmode=driving
```

## Logiche Implementate

### Rilevamento Oceani
```
Aree oceaniche predefinite:
- Atlantico: lat [0-70], lng [-80, -10]
- Pacifico: lat [-60-60], lng [100-180] e [-180, -100]
- Indiano: lat [-60-30], lng [30-100]
```

### Calcolo Distanza (Great Circle)
Per voli e traghetti, calcola la distanza geodetica tra due punti:
```
Formula: R = 6371 km
- Converte lat/lng a radianti
- Applica formula haversine
- Disegna rotta su grande cerchio con 100 punti
```

### Selezione Mezzo
```
IF distanza > 1500 km OR attraversa oceano
  → FLYING (con aeroporti)
ELSE IF distanza > 300 km AND zona costiera
  → FERRY
ELSE
  → DRIVING (OSRM)
```

### Calcolo Tempi Aereo
```
Tempo Totale = 
  + (distanza_stradale_1 / 80) [Guida a aeroporto]
  + 2 ore [Check-in + imbarco]
  + (distanza_aerea / 900) [Volo]
  + 1 ora [Ritiro bagagli + transfer]
  + 0.5 ore [Transfer al destinazione]
```

## API e Servizi Utilizzati

1. **OSRM (OpenRouteService)**
   - Per calcoli stradali realistici
   - Endpoint: `https://router.project-osrm.org`
   - Fallback: Haversine se OSRM non disponibile
   - Usato: Per segmenti stradali dei voli

2. **Google Maps**
   - Link di navigazione con mezzo di trasporto
   - URL: `https://www.google.com/maps/dir/?api=1&origin=X&destination=Y&travelmode=MODE`

3. **Leaflet + OpenStreetMap**
   - Visualizzazione mappe
   - Polyline colorate per diversi mezzi

## Performance e Ottimizzazioni

- ✅ Database aeroporti memorizzato in memoria
- ✅ Calcoli distanza locali (no API call)
- ✅ Great circle routes pre-calcolate
- ✅ Caching della geolocalizzazione utente
- ✅ Linee rette per voli (meno workload rispetto a OSRM)
- ✅ Fallback robusti se servizi esterni non disponibili
- ✅ Combinazione percorsi compositi con async/await

## Testing

Per testare le funzionalità:

### Test 1: Percorso Locale (Auto)
- **Partenza**: Lat: 41.9, Lng: 12.5 (Roma)
- **Destinazione**: Lat: 43.77, Lng: 11.23 (Firenze)
- **Aspettato**: 
  - Mezzo: 🚗 Auto
  - Aeroporti: Non mostrati
  - Tempo: ~3-4 ore

### Test 2: Percorso Intercontinentale (Aereo)
- **Partenza**: Lat: 41.9, Lng: 12.5 (Roma)
- **Destinazione**: Lat: -33.95, Lng: 151.18 (Sydney)
- **Aspettato**:
  - Mezzo: ✈️ Aereo
  - Aer.Partenza: ROM (FCO)
  - Aer.Arrivo: SYD (Sydney)
  - Tempo: 22-24 ore
  - Visualizzazione 3 segmenti percorso (stradale + aereo + stradale)

### Test 3: Percorso Costiero Medio (Traghetto)
- **Partenza**: Lat: 41.38, Lng: 2.17 (Barcelona)
- **Destinazione**: Lat: 39.55, Lng: 2.64 (Palma)
- **Aspettato**:
  - Mezzo: ⛴️ Traghetto
  - Aeroporti: Non mostrati
  - Tempo: ~5-6 ore

## Verifiche di Test

✅ Che il mezzo sia selezionato correttamente
✅ Che gli aeroporti vengano identificati correttamente
✅ Che i tempi siano realistici
✅ Che Google Maps apra con la rotta pre-configurata
✅ Che le linee sulla mappa abbiano i colori e stili differenti
✅ Che i popup mostrino le informazioni corrette
✅ Che il percorso composito sia visualizzato correttamente

## Limitazioni Attuali e Miglioramenti Futuri

### Limitazioni:
- Geografie degli oceani sono semplificate
- Tempi non considerano fattori meteo
- Traghetti non considera rotte specifiche
- Database aeroporti non è aggiornabile in real-time

### Miglioramenti Futuri:
1. Integrare GeoJSON completo per oceani
2. Usare API di routing multi-modale (es. Vroom, ORS)
3. Aggiungere support per auto a noleggio/parcheggi
4. Considerare variabilità stagionale dei tempi
5. Integrare prezzi dei voli/traghetti
6. API real-time per orari aeroporti
7. Support per scali intermedi
8. Calcolo del costo totale del viaggio

## Debugging

Se il sistema non seleziona il mezzo corretto:

1. Verifica la distanza calcolata:
   ```typescript
   const dist = this.calculateDistance(origin, destination);
   console.log('Distanza:', dist, 'km');
   ```

2. Controlla gli aeroporti trovati:
   ```typescript
   const dep = this.findNearestAirport(origin);
   const arr = this.findNearestAirport(destination);
   console.log('Departure:', dep.name);
   console.log('Arrival:', arr.name);
   ```

3. Verifica se attraversa oceani:
   ```typescript
   console.log('Cross ocean:', this.isCrossOcean(origin, destination));
   ```

4. Controlla le coordinate:
   ```typescript
   console.log('Origin:', origin);
   console.log('Destination:', destination);
   ```

## Contatti e Supporto

Per domande o bug report, consulta il file CONTRIBUTING.md del progetto.

