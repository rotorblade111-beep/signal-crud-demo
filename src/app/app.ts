import { Component, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer';
import { SiteHeaderComponent } from './shared/components/site-header/site-header';
import { RouteSeoData } from './app.routes';

@Component({
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  // 1. Convert the router navigation events stream into a read-only signal
  private readonly navEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  constructor() {
    // 2. effect() executes immediately on creation (handling initial page load)
    // and automatically re-runs whenever navEnd() changes on subsequent navigations.
    effect(() => {
      // Accessing navEnd() registers it as a tracked dependency for the effect
      this.navEnd(); 
      this.applyRouteMetadata();
    });
  }

  private applyRouteMetadata(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const metadata = route.data['seo'] as RouteSeoData | undefined;
    const title = metadata?.title ?? 'Signal CRUD Demo';
    const description = metadata?.description ?? 'Browse and manage posts in the Signal CRUD Demo.';
    const type = metadata?.type ?? 'website';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }
}