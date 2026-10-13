import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-up.html'
})
export class SignUpComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  repeatedPassword = '';
  month = signal('');
  day = '';
  year = signal('');
  submitted = signal(false);
  emailError = signal<string | null>(null);
  repeatedPasswordError = signal<string | null>(null);
  dateOfBirthError = signal<string | null>(null);
  months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' },
    { value: 3, name: 'March' }, { value: 4, name: 'April' },
    { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' },
    { value: 9, name: 'September' }, { value: 10, name: 'October' },
    { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];
  years = Array.from(
    { length: new Date().getFullYear() - 1899 },
    (_, index) => new Date().getFullYear() - index
  );
  days = computed(() => {
    const month = Number(this.month());
    const year = Number(this.year());
    if (!month || !year) {
      return [];
    }
    return Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, index) => index + 1
    );
  });

  updateMonth(month: string): void {
    this.month.set(month);
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  updateYear(year: string): void {
    this.year.set(year);
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  updateEmail(email: string): void {
    this.email = email;
    this.emailError.set(null);
  }

  updateRepeatedPassword(password: string): void {
    this.repeatedPassword = password;
    this.repeatedPasswordError.set(null);
  }

  onDayAttempt(): void {
    this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
  }

  shouldShowDateOfBirthError(yearTouched: boolean | null, monthTouched: boolean | null): boolean {
    return Boolean(
      this.dateOfBirthError() &&
      !this.submitted() &&
      !(yearTouched && !this.year()) &&
      !(monthTouched && !this.month())
    );
  }

  signUp(): void {
    this.submitted.set(true);
    this.emailError.set(null);
    this.repeatedPasswordError.set(null);
    this.dateOfBirthError.set(null);
    let hasInvalidInput = false;

    if (this.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      hasInvalidInput = true;
    }
    if (this.repeatedPassword && this.password !== this.repeatedPassword) {
      this.repeatedPasswordError.set('Passwords do not match.');
      hasInvalidInput = true;
    }
    if (!this.month() || !this.year()) {
      hasInvalidInput = true;
    } else if (this.day && !this.days().includes(Number(this.day))) {
      this.dateOfBirthError.set('Select a valid date of birth.');
      hasInvalidInput = true;
    } else if (!this.day) {
      hasInvalidInput = true;
    }

    if (!this.email.trim() || !this.password || !this.repeatedPassword) {
      hasInvalidInput = true;
    }
    if (hasInvalidInput) {
      return;
    }

    const result = this.auth.signUp({
      email: this.email,
      password: this.password,
      dateOfBirth: `${this.year()}-${this.month().padStart(2, '0')}-${this.day.padStart(2, '0')}`
    });
    if (!result.success) {
      this.emailError.set('An account with this email already exists.');
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  private resetInvalidDay(): void {
    if (this.day && !this.days().includes(Number(this.day))) {
      this.day = '';
    }
  }

  private updateDateOfBirthError(): void {
    if (this.dateOfBirthError()) {
      this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
    }
  }

  private missingDatePrerequisitesMessage(): string | null {
    if (!this.year() && !this.month()) {
      return 'Please select your year of birth and month of birth.';
    }
    if (!this.year()) {
      return 'Please select your year of birth.';
    }
    if (!this.month()) {
      return 'Please select your month of birth.';
    }
    return null;
  }
}
