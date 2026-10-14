import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface LoginFormModel {
  username: string;
  password: string;
}

interface PasswordResetFormModel {
  email: string;
  newPassword: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loginModel = signal<LoginFormModel>({ username: '', password: '' });
  loginForm = form(this.loginModel, path => {
    validate(path.username, ({ value }) => {
      const username = value().trim();
      if (!username) {
        return { kind: 'required', message: 'Username is required.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
        return { kind: 'email', message: 'Enter a valid email address.' };
      }
      return undefined;
    });
    required(path.password, { message: 'Password is required.' });
  });
  resetModel = signal<PasswordResetFormModel>({ email: '', newPassword: '' });
  resetForm = form(this.resetModel, path => {
    validate(path.email, ({ value }) => {
      const email = value().trim();
      if (!email) {
        return { kind: 'required', message: 'Email is required.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { kind: 'email', message: 'Enter a valid email address.' };
      }
      return undefined;
    });
    required(path.newPassword, { message: 'Password is required.' });
  });
  submitted = signal(false);
  resetSubmitted = signal(false);
  usernameError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  resetEmailError = signal<string | null>(null);
  resetPasswordError = signal<string | null>(null);
  isResettingPassword = signal(false);
  successMessage = signal<string | null>(null);

  get username(): string {
    return this.loginModel().username;
  }

  set username(username: string) {
    this.loginModel.update(model => ({ ...model, username }));
  }

  get password(): string {
    return this.loginModel().password;
  }

  set password(password: string) {
    this.loginModel.update(model => ({ ...model, password }));
  }

  get resetEmail(): string {
    return this.resetModel().email;
  }

  set resetEmail(email: string) {
    this.resetModel.update(model => ({ ...model, email }));
  }

  get newPassword(): string {
    return this.resetModel().newPassword;
  }

  set newPassword(newPassword: string) {
    this.resetModel.update(model => ({ ...model, newPassword }));
  }

  logIn(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);
    this.successMessage.set(null);
    this.usernameError.set(null);
    this.passwordError.set(null);

    if (!this.loginForm().valid()) {
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

  resetPassword(event?: Event): void {
    event?.preventDefault();
    this.resetSubmitted.set(true);
    this.successMessage.set(null);
    this.resetEmailError.set(null);
    this.resetPasswordError.set(null);
    if (!this.resetForm().valid()) {
      return;
    }
    if (!this.auth.resetPassword(this.resetEmail, this.newPassword)) {
      this.resetEmailError.set('No account was found for that email address.');
      return;
    }

    this.isResettingPassword.set(false);
    this.successMessage.set('Password reset. You can now log in with your new password.');
    this.resetModel.update(model => ({ ...model, newPassword: '' }));
    this.resetSubmitted.set(false);
  }
}
