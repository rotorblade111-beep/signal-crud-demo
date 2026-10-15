import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

  logIn(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);
    this.usernameError.set(null);
    this.passwordError.set(null);

    if (!this.loginForm().valid()) {
      return;
    }
    if (!this.auth.logIn(this.username, this.password)) {
      this.usernameError.set('The username or password is incorrect.');
      this.passwordError.set('The username or password is incorrect.');
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/home';
    void this.router.navigateByUrl(destination);
  }
}
