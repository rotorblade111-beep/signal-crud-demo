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

  it('keeps account creation enabled and shows required errors after an empty submit', () => {
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    expect(fixture.nativeElement.textContent).toContain('Please re-type your password.');
    const dateOfBirthText = fixture.nativeElement.querySelector('fieldset').textContent as string;
    expect(dateOfBirthText.match(/Year of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText.match(/Month of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText.match(/Day of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText).not.toContain('Please select your year of birth and month of birth.');
  });

  it('shows email format feedback after blur and mismatch feedback beside confirmation', () => {
    const email = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');

    const component = fixture.componentInstance;
    component.email = 'valid@example.com';
    component.password = 'one';
    component.repeatedPassword = 'two';
    component.updateYear('2002');
    component.updateMonth('4');
    component.day = '1';
    component.signUp();
    fixture.detectChanges();
    expect(component.repeatedPasswordError()).toBe('Passwords do not match.');
  });

  it('shows only one invalid-email message after repeated sign-up submissions', () => {
    const email = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    submit.click();
    fixture.detectChanges();
    submit.click();
    fixture.detectChanges();

    const emailLabel = email.closest('label')?.textContent ?? '';
    expect(emailLabel.match(/Enter a valid email address\./g)).toHaveLength(1);
  });

  it('orders date selectors by year, month, then day', () => {
    const selectors = Array.from(
      fixture.nativeElement.querySelectorAll('fieldset select') as NodeListOf<HTMLSelectElement>
    );

    expect(selectors.map(select => select.getAttribute('aria-label'))).toEqual([
      'Year',
      'Month',
      'Day'
    ]);
  });

  it('shows specific missing year and month messages when the day selector is focused', () => {
    const component = fixture.componentInstance;
    component.email = 'valid@example.com';
    const daySelect = fixture.nativeElement.querySelector('select[name="day"]') as HTMLSelectElement;

    daySelect.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(component.dateOfBirthError()).toBe(
      'Please select your year of birth and month of birth.'
    );

    component.updateYear('2002');
    daySelect.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(component.dateOfBirthError()).toBe('Please select your month of birth.');

    component.updateMonth('4');
    expect(component.dateOfBirthError()).toBeNull();
    expect(component.days()).toHaveLength(30);
  });

  it('shows only the missing prerequisite message after submitting with one DOB part selected', () => {
    const component = fixture.componentInstance;
    component.email = 'valid@example.com';
    component.password = 'secret';
    component.repeatedPassword = 'secret';
    component.updateYear('2002');

    component.signUp();
    fixture.detectChanges();

    let dateOfBirthText = fixture.nativeElement.querySelector('fieldset').textContent as string;
    expect(dateOfBirthText.match(/Month of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText).not.toContain('Please select your month of birth.');
    expect(dateOfBirthText).not.toContain('Day of birth is required.');

    component.submitted.set(false);
    component.updateYear('');
    component.updateMonth('4');
    component.signUp();
    fixture.detectChanges();

    dateOfBirthText = fixture.nativeElement.querySelector('fieldset').textContent as string;
    expect(dateOfBirthText.match(/Year of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText).not.toContain('Please select your year of birth.');
    expect(dateOfBirthText).not.toContain('Day of birth is required.');
  });

  it('does not duplicate the year error with the day-prerequisite message after year was touched', () => {
    const component = fixture.componentInstance;
    const yearSelect = fixture.nativeElement.querySelector('select[name="year"]') as HTMLSelectElement;
    const daySelect = fixture.nativeElement.querySelector('select[name="day"]') as HTMLSelectElement;
    yearSelect.dispatchEvent(new FocusEvent('focus'));
    yearSelect.dispatchEvent(new FocusEvent('blur'));
    daySelect.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const dateOfBirthText = fixture.nativeElement.querySelector('fieldset').textContent as string;
    expect(dateOfBirthText.match(/Year of birth is required\./g)).toHaveLength(1);
    expect(dateOfBirthText).not.toContain('Please select your year of birth and month of birth.');
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
    component.updateYear('2002');
    component.day = '31';

    component.signUp();

    expect(component.repeatedPasswordError()).toBe('Passwords do not match.');
    component.repeatedPassword = 'secret';
    component.signUp();
    expect(component.dateOfBirthError()).toBe('Select a valid date of birth.');
    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
  });
});
