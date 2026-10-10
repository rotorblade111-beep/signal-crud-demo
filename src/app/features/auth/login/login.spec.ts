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
    expect(component.errorMessage()).toContain('incorrect');

    component.password = 'correct';
    component.logIn();
    await fixture.whenStable();
    expect(auth.currentUser()?.email).toBe('member@example.com');
    expect(router.url).toBe('/home');
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
