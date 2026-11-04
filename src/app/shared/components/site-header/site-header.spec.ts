import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SiteHeaderComponent } from './site-header';

@Component({ template: '' })
class TestPageComponent {}

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: TestPageComponent },
          { path: 'sign-up', component: TestPageComponent },
          { path: 'home', component: TestPageComponent },
          { path: 'personal/:userId', component: TestPageComponent },
          { path: 'profile', component: TestPageComponent }
        ])
      ]
    }).compileComponents();
    TestBed.inject(AuthService).clearSession();
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('hides the sign-up/login action on both authentication pages', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Sign UP/Login');

    await router.navigateByUrl('/sign-up');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Sign UP/Login');
  });

  it('shows the sign-up/login action on other public pages', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/home');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sign UP/Login');
  });

  it('links authenticated users to their personalized feed', () => {
    TestBed.inject(AuthService).currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    fixture.detectChanges();
    const link = fixture.debugElement.queryAll(By.directive(RouterLink))
      .find(element => element.nativeElement.textContent.includes('Personalized Feed'));

    expect(link?.nativeElement.getAttribute('href')).toBe('/personal/7');
  });

  it('opens the animated account menu with a profile link', () => {
    TestBed.inject(AuthService).currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      'button[aria-label="Open account menu"]'
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('#account-menu') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList).not.toContain('opacity-0');
    expect(menu.textContent).toContain('Profile');
    expect(menu.textContent).toContain('Logout');
    expect((menu.querySelector('a[routerLink="/profile"]') as HTMLAnchorElement).textContent).toContain('Profile');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(menu.hasAttribute('inert')).toBe(true);
  });

  it('navigates to Profile from the drawer and closes the menu', async () => {
    TestBed.inject(AuthService).currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Open account menu"]').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#account-menu a[routerLink="/profile"]') as HTMLAnchorElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/profile');
    expect(fixture.componentInstance.isMenuOpen()).toBe(false);
  });

  it('logs out from the drawer, clears the session, and navigates to login', async () => {
    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    auth.accessToken.set('test-access-token');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/home');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Open account menu"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#account-menu button:not([disabled])').click();

    const request = httpTesting.expectOne('http://localhost:5093/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);
    await fixture.whenStable();

    expect(auth.currentUser()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(router.url).toBe('/login');
    expect(fixture.nativeElement.querySelector('#account-menu')).toBeNull();
  });

  it('clears local session and navigates to login if server logout fails', async () => {
    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    auth.accessToken.set('test-access-token');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/home');
    fixture.detectChanges();
    const logout = fixture.componentInstance.logOut();

    httpTesting.expectOne('http://localhost:5093/auth/logout').flush(
      { title: 'Logout failed' },
      { status: 500, statusText: 'Server Error' }
    );
    await logout;

    expect(auth.currentUser()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(router.url).toBe('/login');
  });
});
