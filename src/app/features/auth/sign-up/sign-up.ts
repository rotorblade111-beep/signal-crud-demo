import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface SignUpFormModel {
  email: string;
  password: string;
  repeatedPassword: string;
  year: string;
  month: string;
  day: string;
}

@Component({
  selector: 'app-sign-up',
  imports: [FormField, RouterLink],
  templateUrl: './sign-up.html'
})
export class SignUpComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  signUpModel = signal<SignUpFormModel>({
    email: '',
    password: '',
    repeatedPassword: '',
    year: '',
    month: '',
    day: ''
  });
  signUpForm = form(this.signUpModel, path => {
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
    required(path.password, { message: 'Password is required.' });
    required(path.repeatedPassword, { message: 'Please re-type your password.' });
    required(path.year, { message: 'Year of birth is required.' });
    required(path.month, { message: 'Month of birth is required.' });
    required(path.day, { message: 'Day of birth is required.' });
  });
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
    const month = Number(this.signUpModel().month);
    const year = Number(this.signUpModel().year);
    if (!month || !year) {
      return [];
    }
    return Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, index) => index + 1
    );
  });

  constructor() {
    effect(() => {
      const { year, month, day } = this.signUpModel();
      const availableDays = this.days();
      if (day && (!year || !month || !availableDays.includes(Number(day)))) {
        this.updateField('day', '');
      }
      if (this.dateOfBirthError()) {
        this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
      }
    });
  }

  get email(): string {
    return this.signUpModel().email;
  }

  set email(email: string) {
    this.updateField('email', email);
  }

  get password(): string {
    return this.signUpModel().password;
  }

  set password(password: string) {
    this.updateField('password', password);
  }

  get repeatedPassword(): string {
    return this.signUpModel().repeatedPassword;
  }

  set repeatedPassword(repeatedPassword: string) {
    this.updateField('repeatedPassword', repeatedPassword);
  }

  get month(): string {
    return this.signUpModel().month;
  }

  set month(month: string) {
    this.updateField('month', month);
  }

  get day(): string {
    return this.signUpModel().day;
  }

  set day(day: string) {
    this.updateField('day', day);
  }

  get year(): string {
    return this.signUpModel().year;
  }

  set year(year: string) {
    this.updateField('year', year);
  }

  updateMonth(month: string): void {
    this.month = month;
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  updateYear(year: string): void {
    this.year = year;
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  onDayAttempt(): void {
    this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
  }

  shouldShowDateOfBirthError(yearTouched: boolean | null, monthTouched: boolean | null): boolean {
    return Boolean(
      this.dateOfBirthError() &&
      !this.submitted() &&
      !(yearTouched && !this.year) &&
      !(monthTouched && !this.month)
    );
  }

  signUp(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);
    this.emailError.set(null);
    this.repeatedPasswordError.set(null);
    this.dateOfBirthError.set(null);
    let hasInvalidInput = false;

    if (this.repeatedPassword && this.password !== this.repeatedPassword) {
      this.repeatedPasswordError.set('Passwords do not match.');
      hasInvalidInput = true;
    }
    if (!this.month || !this.year) {
      hasInvalidInput = true;
    } else if (this.day && !this.days().includes(Number(this.day))) {
      this.dateOfBirthError.set('Select a valid date of birth.');
      hasInvalidInput = true;
    } else if (!this.day) {
      hasInvalidInput = true;
    }

    if (!this.signUpForm().valid()) {
      hasInvalidInput = true;
    }
    if (hasInvalidInput) {
      return;
    }

    const result = this.auth.signUp({
      email: this.email,
      password: this.password,
      dateOfBirth: `${this.year}-${this.month.padStart(2, '0')}-${this.day.padStart(2, '0')}`
    });
    if (!result.success) {
      this.emailError.set('An account with this email already exists.');
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  private updateDateOfBirthError(): void {
    if (this.dateOfBirthError()) {
      this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
    }
  }

  private resetInvalidDay(): void {
    if (this.day && !this.days().includes(Number(this.day))) {
      this.day = '';
    }
  }

  private missingDatePrerequisitesMessage(): string | null {
    if (!this.year && !this.month) {
      return 'Please select your year of birth and month of birth.';
    }
    if (!this.year) {
      return 'Please select your year of birth.';
    }
    if (!this.month) {
      return 'Please select your month of birth.';
    }
    return null;
  }

  private updateField<K extends keyof SignUpFormModel>(field: K, value: SignUpFormModel[K]): void {
    this.signUpModel.update(model => ({ ...model, [field]: value }));
  }
}
