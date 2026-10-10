import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

@Component({ template: '' })
class TestRouteComponent {}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: TestRouteComponent },
          { path: 'home', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'add-post', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'edit-post/:id', component: TestRouteComponent, canActivate: [authGuard] },
          { path: 'view-post/:id', component: TestRouteComponent, canActivate: [authGuard] }
        ])
      ]
    });
  });

  it('redirects unauthenticated requests to login with the requested destination', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/edit-post/12');

    expect(router.url).toBe('/login?returnUrl=%2Fedit-post%2F12');
  });

  it('allows a signed-in user to navigate to protected post routes', async () => {
    TestBed.inject(AuthService).signUp({
      email: 'user@example.com',
      password: 'password',
      dateOfBirth: '2000-01-01'
    });
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/view-post/12');

    expect(router.url).toBe('/view-post/12');
  });
});
