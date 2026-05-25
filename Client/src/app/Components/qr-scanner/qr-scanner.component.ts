import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { QrScannerService } from '../../Services/qr-scanner.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CookieBannerComponent, FooterComponent],
  templateUrl: './qr-scanner.component.html'
})
export class QrScannerComponent implements OnDestroy {
  constructor(private qrService: QrScannerService, public router: Router) {}

  ngOnInit() {
    this.qrService.startScanner('reader', (decodedText) => {
      this.qrService.stopScanner();
      this.router.navigate(['/detail', decodedText]);
    });
  }

  ngOnDestroy() {
    this.qrService.stopScanner();
  }
}