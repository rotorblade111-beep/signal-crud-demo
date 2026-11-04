import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter, map, startWith } from 'rxjs';
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
  private elementRef = inject(ElementRef<HTMLElement>);
  isMenuOpen = signal(false);
  readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.isAuthenticationUrl(event.urlAfterRedirects)),
      startWith(this.isAuthenticationUrl(this.router.url))
    ),
    { initialValue: this.isAuthenticationUrl(this.router.url) }
  );

  async logOut(): Promise<void> {
    this.isMenuOpen.set(false);
    try {
      await firstValueFrom(this.auth.logOut());
    } catch (error: unknown) {
      console.error('Failed to log out', error);
    } finally {
      await this.router.navigateByUrl('/login');
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update(isOpen => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeMenuOnEscape(): void {
    this.closeMenu();
  }

  private isAuthenticationUrl(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/login' || path === '/sign-up' || path === '/reset-password';
  }
}
