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
  errorMessage = signal<string | null>(null);
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
  }

  updateYear(year: string): void {
    this.year.set(year);
    this.resetInvalidDay();
  }

  signUp(): void {
    this.errorMessage.set(null);

    if (this.password !== this.repeatedPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    if (!this.month() || !this.day || !this.year() || !this.days().includes(Number(this.day))) {
      this.errorMessage.set('Select a valid date of birth.');
      return;
    }

    const result = this.auth.signUp({
      email: this.email,
      password: this.password,
      dateOfBirth: `${this.year()}-${this.month().padStart(2, '0')}-${this.day.padStart(2, '0')}`
    });
    if (!result.success) {
      this.errorMessage.set('An account with this email already exists.');
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  private resetInvalidDay(): void {
    if (this.day && !this.days().includes(Number(this.day))) {
      this.day = '';
    }
  }
}
