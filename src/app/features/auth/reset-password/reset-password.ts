import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subject, switchMap, timer } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

interface ResetPasswordFormModel {
  email: string;
  newPassword: string;
  repeatedPassword: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [FormField, RouterLink],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private redirectRequests = new Subject<void>();

  resetModel = signal<ResetPasswordFormModel>({
    email: '',
    newPassword: '',
    repeatedPassword: ''
  });
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
    minLength(path.newPassword, 8, { message: 'Password must be at least 8 characters.' });
    required(path.repeatedPassword, { message: 'Please re-type your password.' });
  });
  submitted = signal(false);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  passwordsDoNotMatch = computed(() =>
    Boolean(this.newPassword && this.repeatedPassword && this.newPassword !== this.repeatedPassword)
  );
  private redirectResult = toSignal(
    this.redirectRequests.pipe(switchMap(() => timer(5000))),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      if (this.redirectResult() !== null) {
        void this.router.navigateByUrl('/login');
      }
    });
  }

  get email(): string {
    return this.resetModel().email;
  }

  set email(email: string) {
    this.resetModel.update(model => ({ ...model, email }));
  }

  get newPassword(): string {
    return this.resetModel().newPassword;
  }

  set newPassword(newPassword: string) {
    this.resetModel.update(model => ({ ...model, newPassword }));
  }

  get repeatedPassword(): string {
    return this.resetModel().repeatedPassword;
  }

  set repeatedPassword(repeatedPassword: string) {
    this.resetModel.update(model => ({ ...model, repeatedPassword }));
  }

  async resetPassword(event?: Event): Promise<void> {
    event?.preventDefault();
    this.submitted.set(true);
    this.emailError.set(null);
    this.passwordError.set(null);

    if (!this.resetForm().valid()) {
      return;
    }
    if (this.newPassword !== this.repeatedPassword) {
      this.passwordError.set('Passwords do not match.');
      return;
    }
    try {
      await firstValueFrom(this.auth.resetPassword(this.email, this.newPassword));
      this.successMessage.set('Password reset. You can now log in with your new password.');
      this.redirectRequests.next();
    } catch (error: unknown) {
      console.error('Failed to reset password', error);
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.emailError.set('No account was found for that email address.');
      } else {
        this.passwordError.set('Could not reset your password. Please try again.');
      }
    }
  }
}
