import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

interface LoginFormModel {
  username: string;
  password: string;
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
  submitted = signal(false);
  usernameError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

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

  async logIn(event?: Event): Promise<void> {
    event?.preventDefault();
    this.submitted.set(true);
    this.usernameError.set(null);
    this.passwordError.set(null);

    if (!this.loginForm().valid()) {
      return;
    }
    try {
      await firstValueFrom(this.auth.logIn(this.username, this.password));
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
        ? returnUrl
        : '/home';
      void this.router.navigateByUrl(destination);
    } catch (error: unknown) {
      console.error('Failed to log in', error);
      const message = error instanceof HttpErrorResponse && error.status === 401
        ? 'The username or password is incorrect.'
        : 'Could not log in. Please try again.';
      this.usernameError.set(message);
      this.passwordError.set(message);
    }
  }
}
