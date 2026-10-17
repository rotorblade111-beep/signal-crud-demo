import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, of, shareReplay, tap, throwError } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5093/auth';
  readonly currentUser = signal<AuthUser | null>(null);
  private sessionRequest: Observable<AuthUser | null> | null = null;

  signUp(user: SignUpRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/sign-up`, user, { withCredentials: true }).pipe(
      tap(authUser => this.currentUser.set(authUser))
    );
  }

  logIn(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/login`, { username, password }, { withCredentials: true }).pipe(
      tap(authUser => this.currentUser.set(authUser))
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
    if (currentUser) {
      return of(currentUser);
    }
    if (!this.sessionRequest) {
      this.sessionRequest = this.http.get<AuthUser>(`${this.apiUrl}/session`, { withCredentials: true }).pipe(
        tap(user => this.currentUser.set(user)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.currentUser.set(null);
            return of(null);
          }
          return throwError(() => error);
        }),
        finalize(() => this.sessionRequest = null),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.sessionRequest;
  }

  logOut(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.sessionRequest = null;
      })
    );
  }
}
