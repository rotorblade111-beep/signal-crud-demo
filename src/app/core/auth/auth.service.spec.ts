import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthTokenResponse, AuthUser } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let httpTesting: HttpTestingController;
  const apiUrl = 'http://localhost:5093/auth';
  const user: AuthUser = {
    id: 1,
    email: 'user@example.com',
    dateOfBirth: '2000-02-29'
  };
  const tokens: AuthTokenResponse = {
    user,
    accessToken: 'signed-access-token',
    accessTokenExpiresAt: '2026-10-18T10:15:00+00:00'
  };

  beforeEach(() => {
    // Prevent localStorage state from bleeding between tests
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    auth = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('registers through the backend and stores only the safe user response', () => {
    auth.signUp({
      email: 'User@Example.com',
      password: 'SecurePassword123',
      dateOfBirth: '2000-02-29'
    }).subscribe();

    const request = httpTesting.expectOne(`${apiUrl}/sign-up`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      email: 'User@Example.com',
      password: 'SecurePassword123',
      dateOfBirth: '2000-02-29'
    });
    request.flush(tokens, { status: 201, statusText: 'Created' });

    expect(auth.currentUser()).toEqual(user);
    expect(auth.accessToken()).toBe(tokens.accessToken);
    expect(auth.currentUser()).not.toHaveProperty('password');
  });

  it('authenticates with an access token and clears token state on logout', () => {
    auth.logIn('USER@example.com', 'SecurePassword123').subscribe();

    const request = httpTesting.expectOne(`${apiUrl}/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      username: 'USER@example.com',
      password: 'SecurePassword123'
    });
    request.flush(tokens);

    expect(auth.currentUser()).toEqual(user);
    expect(auth.accessToken()).toBe(tokens.accessToken);
    auth.logOut().subscribe();
    const logoutRequest = httpTesting.expectOne(`${apiUrl}/logout`);
    expect(logoutRequest.request.method).toBe('POST');
    expect(logoutRequest.request.withCredentials).toBe(true);
    logoutRequest.flush(null);
    expect(auth.currentUser()).toBeNull();
    expect(auth.accessToken()).toBeNull();
  });

  it('restores the signed-in profile by rotating the refresh token', () => {
    let restoredUser: AuthUser | null | undefined;
    auth.restoreSession().subscribe(userResponse => restoredUser = userResponse);

    const request = httpTesting.expectOne(`${apiUrl}/refresh`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(tokens);

    expect(restoredUser).toEqual(user);
    expect(auth.currentUser()).toEqual(user);
    expect(auth.accessToken()).toBe(tokens.accessToken);
  });

  it('treats an expired or missing refresh token as signed out', () => {
    let restoredUser: AuthUser | null | undefined;
    auth.restoreSession().subscribe(userResponse => restoredUser = userResponse);

    httpTesting.expectOne(`${apiUrl}/refresh`).flush(
      { title: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(restoredUser).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(auth.accessToken()).toBeNull();
  });

  it('sends password resets to the backend without storing the new password in frontend state', () => {
    auth.resetPassword('user@example.com', 'NewPassword123').subscribe();

    const request = httpTesting.expectOne(`${apiUrl}/reset-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      email: 'user@example.com',
      newPassword: 'NewPassword123'
    });
    request.flush(null);

    expect(auth.currentUser()).toBeNull();
  });
});
