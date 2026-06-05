import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
import { NavbarComponent } from "../navbar/navbar.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-parenti',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './relatives.component.html',
  styleUrls: ['./relatives.component.scss']
})
export class ParentiComponent implements OnInit {
  deceased: any[] = [];
  loading = true;
  error = '';
  private API = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.error = 'Utente non trovato';
      this.loading = false;
      return;
    }
    this.http.get<any[]>(`${this.API}/users/${user.userId}/deceased`).subscribe({
      next: (data) => { this.deceased = data; this.loading = false; },
      error: () => { this.error = 'Errore nel caricamento'; this.loading = false; }
    });
  }

  openProfile(id: string): void {
    this.router.navigate(['/parenti', id]);
  }

  getAge(birth: string, death: string): number {
    return new Date(death).getFullYear() - new Date(birth).getFullYear();
  }
}