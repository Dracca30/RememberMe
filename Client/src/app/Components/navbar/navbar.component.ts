import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDesktop: boolean = true;
  activeSection: string = 'home';
  isLoggedIn: boolean = false;
  userRole: 'user' | 'employee' | null = null;
  private routerSubscription: Subscription;
  private authSubscription: Subscription;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveState();
    });

    this.authSubscription = this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user?.role ?? null;
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.updateActiveState();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isDesktop = window.innerWidth > 768;
  }

  private updateActiveState(): void {
    const url = this.router.url;
    if (url === '/' || url === '/home') {
      this.activeSection = 'home';
    } else if (url === '/map') {
      this.activeSection = 'map';
    } else if (url === '/scan') {
      this.activeSection = 'scan';
    } else if (url === '/settings') {
      this.activeSection = 'settings';
    } else if (url === '/parenti') {
      this.activeSection = 'parenti';
    } else if (url === '/aggiungi-deceduto') {
      this.activeSection = 'aggiungi-deceduto';
    } else {
      this.activeSection = '';
    }
  }

  goToHome() { this.router.navigate(['/']); }
  goToMap() { this.router.navigate(['/map']); }
  goToScan() { this.router.navigate(['/scan']); }
  goToSettings() { this.router.navigate(['/settings']); }
  goToParenti() { this.router.navigate(['/parenti']); }
  goToAggiungiDeceduto() { this.router.navigate(['/aggiungi-deceduto']); }
  goToRegister() { this.router.navigate(['/register']); }
}