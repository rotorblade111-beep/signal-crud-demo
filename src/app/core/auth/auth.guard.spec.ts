import { Component, PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

@Component({ template: '' })
class TestRouteComponent {}

describe('authGuard', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: TestRouteComponent },
          { path: 'home', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'add-post', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'edit-post/:id', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'view-post/:id', component: TestRouteComponent, canActivate: [authGuard] }
        ])
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('redirects unauthenticated requests to login with the requested destination', async () => {
    const router = TestBed.inject(Router);
    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/edit-post/12' } as RouterStateSnapshot)
    );
    expect(guardResult).toBeInstanceOf(Observable);
    const resolvedGuard = firstValueFrom(guardResult as Observable<boolean | UrlTree>);
    httpTesting.expectOne('http://localhost:5093/auth/refresh').flush(
      { title: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );
    const result = await resolvedGuard;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fedit-post%2F12');
  });

  it('allows a signed-in user to navigate to protected post routes', async () => {
    const auth = TestBed.inject(AuthService);
    // Simulate a session already restored from localStorage (both signals populated)
    auth.currentUser.set({
      id: 1,
      email: 'user@example.com',
      dateOfBirth: '2000-01-01'
    });
    auth.accessToken.set('valid-access-token');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/view-post/12' } as RouterStateSnapshot)
    );
    expect(result).toBe(true);
    httpTesting.expectNone('http://localhost:5093/auth/refresh');
  });
});
