import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-header.html'
})
export class SiteHeaderComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.isAuthenticationUrl(event.urlAfterRedirects)),
      startWith(this.isAuthenticationUrl(this.router.url))
    ),
    { initialValue: this.isAuthenticationUrl(this.router.url) }
  );

  logOut(): void {
    this.auth.logOut();
    void this.router.navigateByUrl('/login');
  }

  private isAuthenticationUrl(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/login' || path === '/sign-up';
  }
}
