import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService, AuthUser } from '../../../core/auth/auth.service';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: AuthService;
  let httpTesting: HttpTestingController;
  const authUrl = 'http://localhost:5093/auth';
  const user: AuthUser = {
    id: 1,
    email: 'member@example.com',
    dateOfBirth: '2000-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'home', component: LoginComponent }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/home' }) } }
        }
      ]
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    auth.currentUser.set(user);
    auth.logOut();
  });

  afterEach(() => httpTesting.verify());

  it('authenticates users and reports invalid credentials', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    component.username = 'member@example.com';
    component.password = 'incorrect';
    const invalidLogin = component.logIn();
    httpTesting.expectOne(`${authUrl}/login`).flush(
      { title: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await invalidLogin;
    expect(component.passwordError()).toContain('incorrect');

    component.password = 'correct';
    const successfulLogin = component.logIn();
    httpTesting.expectOne(`${authUrl}/login`).flush(user);
    await successfulLogin;
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
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    expect(username.classList).toContain('!border-red-500');
    expect(password.classList).toContain('!border-red-500');
    expect(username.classList).toContain('ring-4');
    expect(password.classList).toContain('ring-4');
    expect(auth.currentUser()).toBeNull();
  });

  it('treats whitespace-only usernames as required', () => {
    const component = fixture.componentInstance;
    component.username = '   ';
    component.password = 'correct';
    component.logIn();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Username is required.');
    expect(auth.currentUser()).toBeNull();
  });

  it('shows an email format error after blur and a credentials error under password', async () => {
    const component = fixture.componentInstance;
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    username.value = 'not-an-email';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    username.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.nativeElement.querySelector('main').dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    expect(username.classList).toContain('!border-red-500');

    component.username = 'member@example.com';
    component.password = 'incorrect';
    const login = component.logIn();
    httpTesting.expectOne(`${authUrl}/login`).flush(
      { title: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await login;
    fixture.detectChanges();
    expect(component.passwordError()).toContain('incorrect');
  });

  it('shows only one invalid-email message after repeated login submissions', () => {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
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

  it('links to the standalone password reset page', () => {
    const resetLink = fixture.nativeElement.querySelector('a[routerLink="/reset-password"]') as HTMLAnchorElement;
    expect(resetLink.textContent).toContain('Forgot your password?');
  });

  it('shows an explicit error if the login API is unavailable', async () => {
    const component = fixture.componentInstance;
    component.username = 'member@example.com';
    component.password = 'correct';
    const login = component.logIn();
    httpTesting.expectOne(`${authUrl}/login`).flush(
      { title: 'Unavailable' },
      { status: 500, statusText: 'Server Error' }
    );
    await login;

    expect(component.passwordError()).toContain('Could not log in');
  });
});
