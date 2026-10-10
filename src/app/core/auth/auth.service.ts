import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  email: string;
  password: string;
  dateOfBirth: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: AuthUser[] = [];
  readonly currentUser = signal<AuthUser | null>(null);

  signUp(user: AuthUser): { success: true } | { success: false; reason: 'exists' } {
    const email = user.email.trim().toLocaleLowerCase();
    if (this.users.some(existing => existing.email === email)) {
      return { success: false, reason: 'exists' };
    }

    const registeredUser = { ...user, email };
    this.users.push(registeredUser);
    this.currentUser.set(registeredUser);
    return { success: true };
  }

  logIn(username: string, password: string): boolean {
    const email = username.trim().toLocaleLowerCase();
    const user = this.users.find(candidate =>
      candidate.email === email && candidate.password === password
    );
    if (!user) {
      return false;
    }

    this.currentUser.set(user);
    return true;
  }

  resetPassword(email: string, newPassword: string): boolean {
    const normalizedEmail = email.trim().toLocaleLowerCase();
    const user = this.users.find(candidate => candidate.email === normalizedEmail);
    if (!user) {
      return false;
    }

    user.password = newPassword;
    return true;
  }

  logOut(): void {
    this.currentUser.set(null);
  }
}
