import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomBarComponent } from './Components/bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomBarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  
  ngOnInit(): void {
    this.loadAndApplyTheme();
  }

  private loadAndApplyTheme(): void {
    const settings = localStorage.getItem('appSettings');
    let theme: 'light' | 'dark' | 'auto' = 'dark';
    
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        theme = parsed.theme || 'dark';
      } catch (e) {
        console.error('Error loading theme settings:', e);
      }
    }
    
    this.applyTheme(theme);
  }

  private applyTheme(theme: string): void {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }
}
