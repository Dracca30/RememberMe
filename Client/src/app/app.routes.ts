import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { CemeteryDetailComponent } from './Components/cemetery-detail/cemetery-detail.component';
import { QrScannerComponent } from './Components/qr-scanner/qr-scanner.component';
import { SettingsComponent } from './Components/settings/settings.component';
import { ReportProblemComponent } from './Components/settings/report-problem.component';
import { VerifyEmailComponent } from './Components/settings/verify-email.component';
import { MapFullscreenComponent } from './Components/map-fullscreen/map-fullscreen.component';
import { LoginComponent } from './Components/login/login.component';
import { ParentiComponent } from './Components/relatives/relatives.component';
import { DeceasedProfileComponent } from './Components/deceased-profile/deceased-profile.component';
import { RegisterComponent } from './Components/register/register.component';
import { EmployeeDashboardComponent } from './Components/employee-dashboard/employee-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'detail/:id', component: CemeteryDetailComponent },
  { path: 'map', component: MapFullscreenComponent },
  { path: 'scan', component: QrScannerComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'settings/report', component: ReportProblemComponent },
  { path: 'settings/change-password', loadComponent: () => import('./Components/settings/change-password.component').then(m => m.ChangePasswordComponent) },
  { path: 'privacy', loadComponent: () => import('./Components/settings/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
  { path: 'terms', loadComponent: () => import('./Components/settings/terms-of-service.component').then(m => m.TermsOfServiceComponent) },
  { path: 'faq', loadComponent: () => import('./Components/settings/faq.component').then(m => m.FaqComponent) },
  { path: 'favorites', loadComponent: () => import('./Components/favorites/favorites.component').then(m => m.FavoritesComponent) },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'verify-email/:token', component: VerifyEmailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'parenti', component: ParentiComponent },
  { path: 'parenti/:id', component: DeceasedProfileComponent },
  { path: 'aggiungi-deceduto', component: EmployeeDashboardComponent },
  { path: '**', redirectTo: '' }
];