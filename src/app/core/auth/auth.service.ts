import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

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

  signUp(user: SignUpRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/sign-up`, user).pipe(
      tap(authUser => this.currentUser.set(authUser))
    );
  }

  logIn(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(authUser => this.currentUser.set(authUser))
    );
  }

  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { email, newPassword });
  }

  logOut(): void {
    this.currentUser.set(null);
  }
}
