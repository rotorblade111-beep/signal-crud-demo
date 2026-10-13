import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  username = '';
  password = '';
  resetEmail = '';
  newPassword = '';
  submitted = signal(false);
  resetSubmitted = signal(false);
  usernameError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  resetEmailError = signal<string | null>(null);
  resetPasswordError = signal<string | null>(null);
  isResettingPassword = signal(false);
  successMessage = signal<string | null>(null);

  updateUsername(username: string): void {
    this.username = username;
    this.usernameError.set(null);
  }

  updatePassword(password: string): void {
    this.password = password;
    this.passwordError.set(null);
  }

  logIn(): void {
    this.submitted.set(true);
    this.successMessage.set(null);
    this.usernameError.set(null);
    this.passwordError.set(null);

    if (!this.username.trim() || !this.password) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.username.trim())) {
      return;
    }
    if (!this.auth.logIn(this.username, this.password)) {
      this.passwordError.set('The username or password is incorrect.');
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/home';
    void this.router.navigateByUrl(destination);
  }

  resetPassword(): void {
    this.resetSubmitted.set(true);
    this.successMessage.set(null);
    this.resetEmailError.set(null);
    this.resetPasswordError.set(null);
    if (!this.resetEmail.trim()) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.resetEmail.trim())) {
      this.resetEmailError.set('Enter a valid email address.');
      return;
    }
    if (!this.newPassword) {
      return;
    }
    if (!this.auth.resetPassword(this.resetEmail, this.newPassword)) {
      this.resetEmailError.set('No account was found for that email address.');
      return;
    }

    this.isResettingPassword.set(false);
    this.successMessage.set('Password reset. You can now log in with your new password.');
    this.newPassword = '';
    this.resetSubmitted.set(false);
  }

  updateResetEmail(email: string): void {
    this.resetEmail = email;
    this.resetEmailError.set(null);
  }

  updateNewPassword(password: string): void {
    this.newPassword = password;
    this.resetPasswordError.set(null);
  }
}
