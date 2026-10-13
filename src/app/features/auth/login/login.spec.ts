import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'home', component: LoginComponent }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/home' }) } }
        }
      ]
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    auth.signUp({ email: 'member@example.com', password: 'correct', dateOfBirth: '2000-01-01' });
    auth.logOut();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('authenticates users and reports invalid credentials', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    component.username = 'member@example.com';
    component.password = 'incorrect';
    component.logIn();
    expect(component.passwordError()).toContain('incorrect');

    component.password = 'correct';
    component.logIn();
    await fixture.whenStable();
    expect(auth.currentUser()?.email).toBe('member@example.com');
    expect(router.url).toBe('/home');
  });

  it('keeps login enabled and shows required field errors after an empty submit', () => {
    const component = fixture.componentInstance;
    const button = fixture.nativeElement.querySelector('form button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(component.submitted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Username is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    const username = fixture.nativeElement.querySelector('input[name="username"]') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    expect(username.classList).toContain('!border-red-500');
    expect(password.classList).toContain('!border-red-500');
    expect(username.classList).toContain('ring-4');
    expect(password.classList).toContain('ring-4');
    expect(auth.currentUser()).toBeNull();
  });

  it('shows an email format error after blur and a credentials error under password', () => {
    const component = fixture.componentInstance;
    const username = fixture.nativeElement.querySelector('input[name="username"]') as HTMLInputElement;
    username.value = 'not-an-email';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    username.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.nativeElement.querySelector('main').dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    expect(username.classList).toContain('!border-red-500');

    component.username = 'member@example.com';
    component.password = 'incorrect';
    component.logIn();
    fixture.detectChanges();
    expect(component.passwordError()).toContain('incorrect');
  });

  it('shows only one invalid-email message after repeated login submissions', () => {
    const username = fixture.nativeElement.querySelector('input[name="username"]') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    username.value = 'not-an-email';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    username.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    password.value = 'some-password';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    submit.click();
    fixture.detectChanges();
    submit.click();
    fixture.detectChanges();

    const usernameLabel = username.closest('label')?.textContent ?? '';
    expect(usernameLabel.match(/Enter a valid email address\./g)).toHaveLength(1);
  });

  it('resets a registered password through the forgot-password flow', () => {
    const component = fixture.componentInstance;
    component.isResettingPassword.set(true);
    component.resetEmail = 'member@example.com';
    component.newPassword = 'updated';
    component.resetPassword();

    expect(component.isResettingPassword()).toBe(false);
    expect(component.successMessage()).toContain('Password reset');
    expect(auth.logIn('member@example.com', 'updated')).toBe(true);
  });
});
