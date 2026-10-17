import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let httpTesting: HttpTestingController;
  const apiUrl = 'http://localhost:5093/auth';
  const user: AuthUser = {
    id: 1,
    email: 'user@example.com',
    dateOfBirth: '2000-02-29'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    auth = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

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
    request.flush(user, { status: 201, statusText: 'Created' });

    expect(auth.currentUser()).toEqual(user);
    expect(auth.currentUser()).not.toHaveProperty('password');
  });

  it('authenticates credentials through the backend and clears the persistent session on logout', () => {
    auth.logIn('USER@example.com', 'SecurePassword123').subscribe();

    const request = httpTesting.expectOne(`${apiUrl}/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      username: 'USER@example.com',
      password: 'SecurePassword123'
    });
    request.flush(user);

    expect(auth.currentUser()).toEqual(user);
    auth.logOut().subscribe();
    const logoutRequest = httpTesting.expectOne(`${apiUrl}/logout`);
    expect(logoutRequest.request.method).toBe('POST');
    expect(logoutRequest.request.withCredentials).toBe(true);
    logoutRequest.flush(null);
    expect(auth.currentUser()).toBeNull();
  });

  it('restores the signed-in profile from the backend session cookie', () => {
    let restoredUser: AuthUser | null | undefined;
    auth.restoreSession().subscribe(userResponse => restoredUser = userResponse);

    const request = httpTesting.expectOne(`${apiUrl}/session`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush(user);

    expect(restoredUser).toEqual(user);
    expect(auth.currentUser()).toEqual(user);
  });

  it('treats an expired or missing session cookie as signed out', () => {
    let restoredUser: AuthUser | null | undefined;
    auth.restoreSession().subscribe(userResponse => restoredUser = userResponse);

    httpTesting.expectOne(`${apiUrl}/session`).flush(
      { title: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(restoredUser).toBeNull();
    expect(auth.currentUser()).toBeNull();
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
