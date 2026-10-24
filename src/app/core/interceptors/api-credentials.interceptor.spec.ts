import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { apiCredentialsInterceptor } from './api-credentials.interceptor';

describe('apiCredentialsInterceptor', () => {
  let httpTesting: HttpTestingController;
  let accessToken: ReturnType<typeof signal<string | null>>;
  let refreshAccessToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    accessToken = signal<string | null>('current-access-token');
    refreshAccessToken = vi.fn(() => of({
      user: { id: 1, email: 'user@example.com', dateOfBirth: '2000-01-01' },
      accessToken: 'refreshed-access-token',
      accessTokenExpiresAt: '2026-10-18T10:15:00+00:00'
    }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiCredentialsInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { accessToken, refreshAccessToken }
        }
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('attaches bearer authorization and credentials to backend API requests', () => {
    TestBed.inject(HttpClient).get('http://localhost:5093/posts').subscribe();

    const request = httpTesting.expectOne('http://localhost:5093/posts');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('Authorization')).toBe('Bearer current-access-token');
    request.flush([]);
  });

  it('does not attach an access token to auth endpoints but includes refresh credentials', () => {
    TestBed.inject(HttpClient).post('http://localhost:5093/auth/refresh', {}).subscribe();

    const request = httpTesting.expectOne('http://localhost:5093/auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('refreshes an expired token and retries a protected request once', () => {
    let response: unknown;
    TestBed.inject(HttpClient).get('http://localhost:5093/posts').subscribe(value => response = value);

    httpTesting.expectOne('http://localhost:5093/posts').flush(
      { title: 'Expired' },
      { status: 401, statusText: 'Unauthorized' }
    );
    const retry = httpTesting.expectOne('http://localhost:5093/posts');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-access-token');
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    retry.flush([{ id: 1 }]);

    expect(response).toEqual([{ id: 1 }]);
  });

  it('does not include credentials or bearer tokens for other origins', () => {
    TestBed.inject(HttpClient).get('https://example.com/data').subscribe();

    const request = httpTesting.expectOne('https://example.com/data');
    expect(request.request.withCredentials).toBe(false);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
