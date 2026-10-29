import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer';
import { SiteHeaderComponent } from './shared/components/site-header/site-header';
import { SeoService } from './core/services/seo.service';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
@Component({
  imports: [RouterOutlet, SiteFooterComponent, SiteHeaderComponent, SnackbarComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  // Injecting SeoService initializes the root service and boots up the global route listener
  private readonly seoService = inject(SeoService);
}