import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5093/auth';
  readonly currentUser = signal<AuthUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  private refreshRequest: Observable<AuthTokenResponse> | null = null;

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
  }

  private setSession(response: AuthTokenResponse): void {
    this.currentUser.set(response.user);
    this.accessToken.set(response.accessToken);
  }
}
