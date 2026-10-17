import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { ResetPasswordComponent } from './reset-password';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let auth: AuthService;
  let httpTesting: HttpTestingController;
  const authUrl = 'http://localhost:5093/auth';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    auth.signUp({
      email: 'member@example.com',
      password: 'correct-password',
      dateOfBirth: '2000-01-01'
    }).subscribe();
    httpTesting.expectOne(`${authUrl}/sign-up`).flush({
      id: 3,
      email: 'member@example.com',
      dateOfBirth: '2000-01-01'
    }, { status: 201, statusText: 'Created' });
    auth.logOut();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('shows required field errors when submitted empty', () => {
    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    expect(fixture.nativeElement.textContent).toContain('Please re-type your password.');
    for (const selector of ['#reset-email', '#reset-new-password', '#reset-repeated-password']) {
      expect((fixture.nativeElement.querySelector(selector) as HTMLInputElement).classList)
        .toContain('!border-red-500');
    }
  });

  it('requires matching passwords before resetting', async () => {
    const component = fixture.componentInstance;
    component.email = 'member@example.com';
    component.newPassword = 'updated-password';
    component.repeatedPassword = 'different';

    const reset = component.resetPassword();
    fixture.detectChanges();

    expect(component.passwordError()).toBe('Passwords do not match.');
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    await reset;
    httpTesting.expectNone(`${authUrl}/reset-password`);
  });

  it('resets the password, displays success, and redirects to login after five seconds', async () => {
    vi.useFakeTimers();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const component = fixture.componentInstance;
    component.email = 'member@example.com';
    component.newPassword = 'updated-password';
    component.repeatedPassword = 'updated-password';

    const reset = component.resetPassword();
    httpTesting.expectOne(`${authUrl}/reset-password`).flush(null);
    await reset;
    fixture.detectChanges();

    expect(component.successMessage()).toContain('Password reset');
    expect(fixture.nativeElement.textContent).toContain('You will be redirected to log in');
    expect(navigateSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(4999);
    expect(navigateSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('reports when the email does not match an account', () => {
    const component = fixture.componentInstance;
    component.email = 'missing@example.com';
    component.newPassword = 'updated-password';
    component.repeatedPassword = 'updated-password';

    const reset = component.resetPassword();
    httpTesting.expectOne(`${authUrl}/reset-password`).flush(
      { title: 'Account not found' },
      { status: 404, statusText: 'Not Found' }
    );

    return reset.then(() => {
      fixture.detectChanges();
      expect(component.emailError()).toBe('No account was found for that email address.');
      expect(component.successMessage()).toBeNull();
    });
  });
});
