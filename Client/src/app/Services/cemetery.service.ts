import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Cemetery } from '../Interfaces/Cemetery';
import { Deceased } from '../Interfaces/Deceased';
import { Memory } from '../Interfaces/Memory';
import { environment } from '../../Environments/environments'

@Injectable({
  providedIn: 'root'
})
export class CemeteryService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/Cemeteries`;
  private deceasedApiUrl = `${environment.apiUrl}/api/Deceaseds`;

  getAllCemeteries(): Observable<Cemetery[]> {
    return this.http.get<Cemetery[]>(this.apiUrl).pipe(
      map(cemeteries => cemeteries.map(cem => this.processCemeteryData(cem)))
    );
  }

  getCemeteryById(id: string): Observable<Cemetery> {
    return this.http.get<Cemetery>(`${this.apiUrl}/${id}`).pipe(
      map(cemetery => this.processCemeteryData(cemetery))
    );
  }

  private processCemeteryData(cemetery: any): Cemetery {
    // Se ha la struttura GeoJSON, estrai lat/lng
    if (cemetery.location && typeof cemetery.location === 'object' && cemetery.location.coordinates) {
      const [lng, lat] = cemetery.location.coordinates;
      return {
        ...cemetery,
        lat,
        lng
      };
    }

    // Altrimenti mantieni la struttura esistente
    return cemetery;
  }

  getDeceasedByCemetery(cemeteryId: string): Observable<Deceased[]> {
    return this.http.get<Deceased[]>(`${this.apiUrl}/${cemeteryId}/Deceased`);
  }

  getDeceasedById(deceasedId: string): Observable<Deceased> {
    return this.http.get<Deceased>(`${this.deceasedApiUrl}/${deceasedId}`);
  }

  addMemory(deceasedId: string, memory: Partial<Memory>): Observable<Memory[]> {
    return this.http.post<Memory[]>(`${this.deceasedApiUrl}/${deceasedId}/memories`, memory);
  }

  deleteMemory(deceasedId: string, memoryId: string): Observable<Memory[]> {
    return this.http.delete<Memory[]>(`${this.deceasedApiUrl}/${deceasedId}/memories/${memoryId}`);
  }

  searchDeceased(name: string): Observable<Deceased[]> {
    return this.http.get<Deceased[]>(`http://localhost:3000/api/Deceaseds/search?name=${encodeURIComponent(name)}`);
  }
}
