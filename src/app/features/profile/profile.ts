import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileResponse, ProfileService } from './services/profile.service';

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
  private readonly profileService = inject(ProfileService);
  readonly activeTab = signal<ProfileTab>('personal');
  readonly mobileMenuOpen = signal(false);
  readonly isLoading = signal(true);
  readonly isSavingPersonal = signal(false);
  readonly isSavingEmail = signal(false);
  readonly isChangingPassword = signal(false);
  readonly personalSubmitted = signal(false);
  readonly accountSubmitted = signal(false);
  readonly passwordSubmitted = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly personalError = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly personalSuccess = signal<string | null>(null);
  readonly emailSuccess = signal<string | null>(null);
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
    void this.loadProfile();
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

  async savePersonalInformation(event: Event): Promise<void> {
    event.preventDefault();
    this.personalSubmitted.set(true);
    this.personalError.set(null);
    this.personalSuccess.set(null);
    const model = this.profileModel();
    if (
      !model.year ||
      !model.month ||
      !model.day ||
      !this.days().includes(Number(model.day)) ||
      this.profileForm.year().invalid() ||
      this.profileForm.month().invalid() ||
      this.profileForm.day().invalid()
    ) {
      return;
    }

    this.isSavingPersonal.set(true);
    try {
      const profile = await firstValueFrom(this.profileService.updatePersonalInformation({
        firstName: model.firstName,
        lastName: model.lastName,
        dateOfBirth: `${model.year}-${model.month.padStart(2, '0')}-${model.day.padStart(2, '0')}`,
        address: model.address,
        country: model.country
      }));
      this.applyPersonalInformation(profile);
      this.personalSuccess.set('Personal information updated.');
    } catch (error: unknown) {
      console.error('Failed to update personal information', error);
      this.personalError.set('Could not update your personal information. Please try again.');
    } finally {
      this.isSavingPersonal.set(false);
    }
  }

  async saveEmail(event: Event): Promise<void> {
    event.preventDefault();
    this.accountSubmitted.set(true);
    this.emailError.set(null);
    this.emailSuccess.set(null);
    if (this.profileForm.email().invalid()) {
      return;
    }

    this.isSavingEmail.set(true);
    try {
      const profile = await firstValueFrom(
        this.profileService.updateEmail(this.profileModel().email.trim())
      );
      this.updateAuthenticatedUser(profile);
      this.profileModel.update(model => ({ ...model, email: profile.email }));
      this.emailSuccess.set('Email address updated.');
    } catch (error: unknown) {
      console.error('Failed to update email address', error);
      this.emailError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? 'An account with this email already exists.'
          : 'Could not update your email address. Please try again.'
      );
    } finally {
      this.isSavingEmail.set(false);
    }
  }

  async changePassword(event: Event): Promise<void> {
    event.preventDefault();
    this.passwordSubmitted.set(true);
    this.passwordError.set(null);
    this.passwordNotice.set(null);
    if (
      this.profileForm.newPassword().invalid() ||
      this.profileForm.repeatedPassword().invalid() ||
      this.passwordMismatch()
    ) {
      if (this.passwordMismatch()) {
        this.passwordError.set('Passwords do not match.');
      }
      return;
    }

    this.isChangingPassword.set(true);
    try {
      await firstValueFrom(this.profileService.changePassword(this.profileModel().newPassword));
      this.profileModel.update(model => ({ ...model, newPassword: '', repeatedPassword: '' }));
      this.passwordNotice.set('Password updated.');
      this.passwordSubmitted.set(false);
    } catch (error: unknown) {
      console.error('Failed to change password', error);
      this.passwordError.set('Could not change your password. Please try again.');
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  private async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      const profile = await firstValueFrom(this.profileService.getProfile());
      this.profileModel.update(model => ({
        ...model,
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        ...this.dateOfBirthFields(profile.dateOfBirth),
        address: profile.address ?? '',
        country: profile.country ?? '',
        email: profile.email
      }));
      this.updateAuthenticatedUser(profile);
    } catch (error: unknown) {
      console.error('Failed to load profile', error);
      this.loadError.set('Could not load your profile. Please refresh the page to try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private applyPersonalInformation(profile: ProfileResponse): void {
    this.profileModel.update(model => ({
      ...model,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      ...this.dateOfBirthFields(profile.dateOfBirth),
      address: profile.address ?? '',
      country: profile.country ?? ''
    }));
    this.updateAuthenticatedUser(profile);
  }

  private dateOfBirthFields(dateOfBirth: string): Pick<ProfileFormModel, 'year' | 'month' | 'day'> {
    const match = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match
      ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) }
      : { year: '', month: '', day: '' };
  }

  private updateAuthenticatedUser(profile: ProfileResponse): void {
    this.auth.updateCurrentUser({
      id: profile.id,
      email: profile.email,
      dateOfBirth: profile.dateOfBirth
    });
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
