import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-bottom-bar',
  templateUrl: './bottom-bar.component.html',
  styleUrls: ['./bottom-bar.component.scss']
})
export class BottomBarComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  activeSection: string = 'home';
  userRole: 'user' | 'employee' | null = null;
  private routerSubscription: Subscription;
  private authSubscription: Subscription;
  
  constructor(private router: Router, private authService: AuthService) {
    this.checkScreenSize();
    this.userRole = this.authService.getUserRole();
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveState();
    });
    this.authSubscription = this.authService.user$.subscribe(user => {
      this.userRole = user?.role ?? null;
    });
  }
  
  ngOnInit(): void {
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
    this.isMobile = window.innerWidth <= 768;
  }
  
  private updateActiveState(): void {
    const url = this.router.url;
    
    if (url === '/' || url === '/home') {
      this.activeSection = 'home';
    } else if (url === '/scan') {
      this.activeSection = 'scan';
    } else if (url === '/settings') {
      this.activeSection = 'settings';
    } else if (url === '/map') {
      this.activeSection = 'map';
    } else if (url.startsWith('/parenti')) {
      this.activeSection = 'parenti';
    } else if (url.startsWith('/aggiungi-deceduto')) {
      this.activeSection = 'aggiungi-deceduto';
    }
    
  }
  
  goToMap(): void {
    this.router.navigate(['/map']).then(() => {
      this.activeSection = 'map';
    });
  }

  goToHome(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl === '/' || currentUrl === '/home') {
      this.smoothScrollToTop();
      this.refreshHomeContent();
    } else {
      this.router.navigate(['/']).then(() => {
        this.activeSection = 'home';
      });
    }
  }
  
  goToScan(): void {
    this.router.navigate(['/scan']).then(() => {
      this.activeSection = 'scan';
    });
  }
  
  goToSettings(): void {
    this.router.navigate(['/settings']).then(() => {
      this.activeSection = 'settings';
    });
  }

  goToParenti(): void {
    this.router.navigate(['/parenti']).then(() => {
      this.activeSection = 'parenti';
    });
  }

  goToGestione(): void {
    this.router.navigate(['/aggiungi-deceduto']).then(() => {
      this.activeSection = 'aggiungi-deceduto';
    });
  }
  
  private smoothScrollToTop(): void {
    const currentScroll = window.pageYOffset;
    const targetScroll = 0;
    const distance = targetScroll - currentScroll;
    const duration = 500;
    let start: number | null = null;
    
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      
      window.scrollTo(0, currentScroll + distance * easeInOutCubic(percentage));
      
      if (progress < duration) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }
  
  private refreshHomeContent(): void {
    const event = new CustomEvent('refreshHomeContent', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }
}