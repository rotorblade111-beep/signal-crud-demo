import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

export interface AuthUser {
  id: number;
  email: string;
  dateOfBirth: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface AuthTokenResponse {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const CURRENT_USER_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly apiUrl = 'http://localhost:5093/auth';
  private refreshRequest: Observable<AuthTokenResponse> | null = null;

  // Signals seeded from localStorage on startup so the token survives page reloads
  readonly accessToken = signal<string | null>(this.loadFromStorage(ACCESS_TOKEN_KEY));
  readonly currentUser = signal<AuthUser | null>(this.loadJsonFromStorage<AuthUser>(CURRENT_USER_KEY));

  signUp(user: SignUpRequest): Observable<AuthUser> {
    return this.http.post<AuthTokenResponse>(`${this.apiUrl}/sign-up`, user, { withCredentials: true }).pipe(
      tap(response => this.setSession(response)),
      map(response => response.user)
    );
  }

  logIn(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthTokenResponse>(
      `${this.apiUrl}/login`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => this.setSession(response)),
      map(response => response.user)
    );
  }

  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/reset-password`,
      { email, newPassword },
      { withCredentials: true }
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    const currentUser = this.currentUser();
    if (currentUser && this.accessToken()) {
      // Both user and token already in memory (seeded from localStorage) — no HTTP call needed
      return of(currentUser);
    }
    return this.refreshAccessToken().pipe(
      map(response => response.user),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clearSession();
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  refreshAccessToken(): Observable<AuthTokenResponse> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.http.post<AuthTokenResponse>(
        `${this.apiUrl}/refresh`,
        {},
        { withCredentials: true }
      ).pipe(
        tap(response => this.setSession(response)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.clearSession();
          }
          return throwError(() => error);
        }),
        finalize(() => this.refreshRequest = null),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refreshRequest;
  }

  logOut(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      finalize(() => this.clearSession())
    );
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.refreshRequest = null;
    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  private setSession(response: AuthTokenResponse): void {
    this.currentUser.set(response.user);
    this.accessToken.set(response.accessToken);
    if (this.isBrowser) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
    }
  }

  /** Reads a plain string value from localStorage (SSR-safe). */
  private loadFromStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  /** Reads a JSON-serialised value from localStorage (SSR-safe). */
  private loadJsonFromStorage<T>(key: string): T | null {
    const raw = this.loadFromStorage(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
