import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SignUpComponent } from './sign-up';

describe('SignUpComponent', () => {
  let fixture: ComponentFixture<SignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [provideRouter([{ path: 'home', component: SignUpComponent }])]
    }).compileComponents();
    fixture = TestBed.createComponent(SignUpComponent);
    fixture.detectChanges();
  });

  it('calculates days per month including leap years and clears an invalid selected day', () => {
    const component = fixture.componentInstance;
    component.updateMonth('2');
    component.updateYear('2024');
    expect(component.days()).toHaveLength(29);

    component.day = '29';
    component.updateYear('2023');
    expect(component.days()).toHaveLength(28);
    expect(component.day).toBe('');

    component.updateMonth('4');
    expect(component.days()).toHaveLength(30);
  });

  it('validates email input and only offers valid days for the selected month and year', () => {
    const email = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(email.validity.typeMismatch).toBe(true);

    const component = fixture.componentInstance;
    component.updateMonth('4');
    component.updateYear('2002');
    fixture.detectChanges();
    expect(component.days()).toHaveLength(30);
    expect(component.days()).not.toContain(31);
  });

  it('registers valid input and navigates to the protected home page', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    component.email = 'valid@example.com';
    component.password = 'secret';
    component.repeatedPassword = 'secret';
    component.updateMonth('2');
    component.day = '29';
    component.updateYear('2024');

    component.signUp();
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).currentUser()?.dateOfBirth).toBe('2024-02-29');
    expect(router.url).toBe('/home');
  });

  it('rejects mismatched passwords and invalid dates', () => {
    const component = fixture.componentInstance;
    component.email = 'valid@example.com';
    component.password = 'secret';
    component.repeatedPassword = 'different';
    component.updateMonth('4');
    component.day = '31';
    component.updateYear('2002');

    component.signUp();

    expect(component.errorMessage()).toBe('Passwords do not match.');
    component.repeatedPassword = 'secret';
    component.signUp();
    expect(component.errorMessage()).toBe('Select a valid date of birth.');
    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
  });
});
