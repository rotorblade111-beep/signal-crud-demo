import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer';
import { SiteHeaderComponent } from './shared/components/site-header/site-header';

@Component({
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('signal-crud-demo');
}
