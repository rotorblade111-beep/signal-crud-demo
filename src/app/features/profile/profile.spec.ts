import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileResponse } from './services/profile.service';
import { ProfileComponent } from './profile';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let httpTesting: HttpTestingController;
  const profile: ProfileResponse = {
    id: 7,
    email: 'member@example.com',
    dateOfBirth: '2000-02-29',
    firstName: 'Taylor',
    lastName: 'Member',
    address: '10 Main Street',
    country: 'Canada'
  };

  beforeEach(async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({
      id: 7,
      email: 'member@example.com',
      dateOfBirth: '2000-02-29'
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    httpTesting.expectOne('http://localhost:5093/profile').flush(profile);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('loads personal details, email, and date of birth from the API', () => {
    const year = fixture.nativeElement.querySelector('select[aria-label="Year"]') as HTMLSelectElement;
    const month = fixture.nativeElement.querySelector('select[aria-label="Month"]') as HTMLSelectElement;
    const day = fixture.nativeElement.querySelector('select[aria-label="Day"]') as HTMLSelectElement;
    const firstName = fixture.nativeElement.querySelector('input[autocomplete="given-name"]') as HTMLInputElement;

    expect(year.value).toBe('2000');
    expect(month.value).toBe('2');
    expect(day.value).toBe('29');
    expect(firstName.value).toBe('Taylor');
    expect(fixture.componentInstance.days()).toHaveLength(29);

    fixture.componentInstance.selectTab('account');
    fixture.detectChanges();
    const email = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    expect(email.value).toBe('member@example.com');
  });

  it('shows optional personal fields and provides country choices', () => {
    expect(fixture.nativeElement.textContent).toContain('First Name');
    expect(fixture.nativeElement.textContent).toContain('Last Name');
    expect(fixture.nativeElement.textContent).toContain('(optional)');
    expect(fixture.nativeElement.querySelector('input[autocomplete="street-address"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('select option[value="Bangladesh"]')).not.toBeNull();
  });

  it('opens the mobile section menu and switches to Account Settings', () => {
    const menuButton = fixture.nativeElement.querySelector(
      'button[aria-controls="profile-menu"]'
    ) as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    const accountTab = Array.from(
      fixture.nativeElement.querySelectorAll('#profile-menu button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Account Settings'))!;
    accountTab.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('account');
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Change password');
  });

  it('preserves form values when switching between profile sections', () => {
    const firstName = fixture.nativeElement.querySelector(
      'input[autocomplete="given-name"]'
    ) as HTMLInputElement;
    firstName.value = 'Jordan';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    fixture.componentInstance.selectTab('account');
    fixture.detectChanges();
    fixture.componentInstance.selectTab('personal');
    fixture.detectChanges();

    expect(firstName.value).toBe('Jordan');
    expect(fixture.componentInstance.profileModel().firstName).toBe('Jordan');
  });

  it('updates and saves personal information through the profile API', async () => {
    const component = fixture.componentInstance;
    component.profileModel.update(model => ({
      ...model,
      firstName: 'Updated',
      lastName: 'Name',
      address: '42 New Road',
      country: 'France'
    }));

    const saving = component.savePersonalInformation(new Event('submit'));
    const request = httpTesting.expectOne(
      'http://localhost:5093/profile/personal-information'
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      firstName: 'Updated',
      lastName: 'Name',
      dateOfBirth: '2000-02-29',
      address: '42 New Road',
      country: 'France'
    });
    request.flush({
      ...profile,
      firstName: 'Updated',
      lastName: 'Name',
      address: '42 New Road',
      country: 'France'
    });
    await saving;

    expect(component.personalSuccess()).toBe('Personal information updated.');
    expect(component.personalError()).toBeNull();
    expect(TestBed.inject(AuthService).currentUser()?.dateOfBirth).toBe('2000-02-29');
  });

  it('saves email, refreshes the local account summary, and reports duplicate email errors', async () => {
    const component = fixture.componentInstance;
    component.selectTab('account');
    fixture.detectChanges();
    component.profileModel.update(model => ({ ...model, email: 'bob@example.com' }));

    const duplicateEmail = component.saveEmail(new Event('submit'));
    httpTesting.expectOne('http://localhost:5093/profile/email').flush(
      { title: 'Email already in use' },
      { status: 409, statusText: 'Conflict' }
    );
    await duplicateEmail;
    expect(component.emailError()).toBe('An account with this email already exists.');

    component.profileModel.update(model => ({ ...model, email: 'updated@example.com' }));
    const updateEmail = component.saveEmail(new Event('submit'));
    httpTesting.expectOne('http://localhost:5093/profile/email').flush({
      ...profile,
      email: 'updated@example.com'
    });
    await updateEmail;

    expect(component.emailSuccess()).toBe('Email address updated.');
    expect(TestBed.inject(AuthService).currentUser()?.email).toBe('updated@example.com');
    expect(localStorage.getItem('currentUser')).toContain('updated@example.com');
  });

  it('validates invalid email and mismatched passwords without sending requests', async () => {
    const component = fixture.componentInstance;
    component.selectTab('account');
    fixture.detectChanges();
    component.profileModel.update(model => ({
      ...model,
      email: 'not-an-email',
      newPassword: 'new-password',
      repeatedPassword: 'different-password'
    }));
    fixture.detectChanges();

    expect(component.passwordMismatch()).toBe(true);

    await component.saveEmail(new Event('submit'));
    await component.changePassword(new Event('submit'));
    fixture.detectChanges();

    expect(component.profileForm.email().invalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    expect(component.passwordError()).toBe('Passwords do not match.');
    expect(component.passwordNotice()).toBeNull();
    httpTesting.expectNone(request => request.url !== 'http://localhost:5093/profile');
  });

  it('changes the password through the authenticated API and clears the password fields', async () => {
    const component = fixture.componentInstance;
    component.selectTab('account');
    fixture.detectChanges();
    component.profileModel.update(model => ({
      ...model,
      newPassword: 'new-password',
      repeatedPassword: 'new-password'
    }));

    const changing = component.changePassword(new Event('submit'));
    const request = httpTesting.expectOne('http://localhost:5093/profile/password');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ newPassword: 'new-password' });
    request.flush(null);
    await changing;

    expect(component.passwordNotice()).toBe('Password updated.');
    expect(component.profileModel().newPassword).toBe('');
    expect(component.profileModel().repeatedPassword).toBe('');
  });
});
