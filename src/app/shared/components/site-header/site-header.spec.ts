import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SiteHeaderComponent } from './site-header';

@Component({ template: '' })
class TestPageComponent {}

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'login', component: TestPageComponent },
          { path: 'sign-up', component: TestPageComponent },
          { path: 'home', component: TestPageComponent },
          { path: 'personal/:userId', component: TestPageComponent }
        ])
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
  });

  it('hides the sign-up/login action on both authentication pages', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Sign UP/Login');

    await router.navigateByUrl('/sign-up');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Sign UP/Login');
  });

  it('shows the sign-up/login action on other public pages', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/home');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sign UP/Login');
  });

  it('links authenticated users to their personalized feed', () => {
    TestBed.inject(AuthService).currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    fixture.detectChanges();
    const link = fixture.debugElement.queryAll(By.directive(RouterLink))
      .find(element => element.nativeElement.textContent.includes('Personalized Feed'));

    expect(link?.nativeElement.getAttribute('href')).toBe('/personal/7');
  });
});
