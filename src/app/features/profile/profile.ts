import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';

type ProfileTab = 'personal' | 'account';

interface ProfileFormModel {
  firstName: string;
  lastName: string;
  year: string;
  month: string;
  day: string;
  address: string;
  country: string;
  email: string;
  newPassword: string;
  repeatedPassword: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormField],
  templateUrl: './profile.html'
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  readonly activeTab = signal<ProfileTab>('personal');
  readonly mobileMenuOpen = signal(false);
  readonly submitted = signal(false);
  readonly months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' },
    { value: 3, name: 'March' }, { value: 4, name: 'April' },
    { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' },
    { value: 9, name: 'September' }, { value: 10, name: 'October' },
    { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];
  readonly years = Array.from(
    { length: new Date().getFullYear() - 1899 },
    (_, index) => new Date().getFullYear() - index
  );
  readonly countries = [
    'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'France', 'Germany',
    'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia', 'Mexico',
    'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Pakistan', 'Philippines',
    'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden',
    'Switzerland', 'Thailand', 'Turkey', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam'
  ];
  readonly profileModel = signal<ProfileFormModel>({
    firstName: '',
    lastName: '',
    year: '',
    month: '',
    day: '',
    address: '',
    country: '',
    email: this.auth.currentUser()?.email ?? '',
    newPassword: '',
    repeatedPassword: ''
  });
  readonly profileForm = form(this.profileModel, path => {
    required(path.year, { message: 'Year of birth is required.' });
    required(path.month, { message: 'Month of birth is required.' });
    required(path.day, { message: 'Day of birth is required.' });
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
    required(path.newPassword, { message: 'New password is required.' });
    minLength(path.newPassword, 8, { message: 'Password must be at least 8 characters.' });
    required(path.repeatedPassword, { message: 'Please re-type your new password.' });
  });
  readonly days = computed(() => {
    const { year, month } = this.profileModel();
    if (!year || !month) {
      return [];
    }
    return Array.from(
      { length: new Date(Number(year), Number(month), 0).getDate() },
      (_, index) => index + 1
    );
  });
  readonly passwordMismatch = computed(() => {
    const { newPassword, repeatedPassword } = this.profileModel();
    return Boolean(repeatedPassword && newPassword !== repeatedPassword);
  });
  readonly dateOfBirthError = signal<string | null>(null);
  readonly passwordNotice = signal<string | null>(null);

  constructor() {
    const dateOfBirth = this.auth.currentUser()?.dateOfBirth;
    const match = dateOfBirth?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      this.profileModel.update(model => ({
        ...model,
        year: match[1],
        month: String(Number(match[2])),
        day: String(Number(match[3]))
      }));
    }

    effect(() => {
      const { year, month, day } = this.profileModel();
      if (day && (!year || !month || !this.days().includes(Number(day)))) {
        this.updateField('day', '');
      }
      if (this.dateOfBirthError()) {
        this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
      }
    });
  }

  selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  updateMonth(month: string): void {
    this.updateField('month', month);
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  updateYear(year: string): void {
    this.updateField('year', year);
    this.resetInvalidDay();
    this.updateDateOfBirthError();
  }

  onDayAttempt(): void {
    this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
  }

  validatePasswordForm(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.passwordNotice.set(
      this.profileForm().valid() && !this.passwordMismatch()
        ? 'Password changes will be available when account updates are connected.'
        : null
    );
  }

  private updateField<K extends keyof ProfileFormModel>(field: K, value: ProfileFormModel[K]): void {
    this.profileModel.update(model => ({ ...model, [field]: value }));
  }

  private resetInvalidDay(): void {
    const day = this.profileModel().day;
    if (day && !this.days().includes(Number(day))) {
      this.updateField('day', '');
    }
  }

  private updateDateOfBirthError(): void {
    if (this.dateOfBirthError()) {
      this.dateOfBirthError.set(this.missingDatePrerequisitesMessage());
    }
  }

  private missingDatePrerequisitesMessage(): string | null {
    const { year, month } = this.profileModel();
    if (!year && !month) {
      return 'Please select your year of birth and month of birth.';
    }
    if (!year) {
      return 'Please select your year of birth.';
    }
    if (!month) {
      return 'Please select your month of birth.';
    }
    return null;
  }
}
