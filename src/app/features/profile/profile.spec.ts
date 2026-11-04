import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileComponent } from './profile';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let httpTesting: HttpTestingController;

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
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('prefills the email and sign-up-style date of birth from the authenticated user', () => {
    const year = fixture.nativeElement.querySelector('select[aria-label="Year"]') as HTMLSelectElement;
    const month = fixture.nativeElement.querySelector('select[aria-label="Month"]') as HTMLSelectElement;
    const day = fixture.nativeElement.querySelector('select[aria-label="Day"]') as HTMLSelectElement;

    expect(year.value).toBe('2000');
    expect(month.value).toBe('2');
    expect(day.value).toBe('29');
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

  it('keeps unsaved field values when switching between profile sections', () => {
    const firstName = fixture.nativeElement.querySelector(
      'input[autocomplete="given-name"]'
    ) as HTMLInputElement;
    firstName.value = 'Taylor';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    fixture.componentInstance.selectTab('account');
    fixture.detectChanges();
    fixture.componentInstance.selectTab('personal');
    fixture.detectChanges();

    expect(firstName.value).toBe('Taylor');
    expect(fixture.componentInstance.profileModel().firstName).toBe('Taylor');
  });

  it('validates email and matching new passwords without making API calls', () => {
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

    component.validatePasswordForm(new Event('submit'));
    fixture.detectChanges();

    expect(component.profileForm.email().invalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    expect(component.passwordNotice()).toBeNull();
    httpTesting.expectNone(() => true);
  });

  it('reports pending backend support when the validated password entries match', () => {
    const component = fixture.componentInstance;
    component.selectTab('account');
    fixture.detectChanges();
    component.profileModel.update(model => ({
      ...model,
      newPassword: 'new-password',
      repeatedPassword: 'new-password'
    }));

    component.validatePasswordForm(new Event('submit'));
    fixture.detectChanges();

    expect(component.passwordMismatch()).toBe(false);
    expect(component.passwordNotice()).toContain('available when account updates are connected');
    expect(fixture.nativeElement.textContent).toContain(component.passwordNotice());
    httpTesting.expectNone(() => true);
  });
});
