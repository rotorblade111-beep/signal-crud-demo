import { Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { RouteSeoData } from '../models/seo.model'; 

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  // 1. Track router navigation events via toSignal
  private readonly navEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  constructor() {
    // 2. Automatically apply metadata on initial load and every subsequent navigation change
    effect(() => {
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