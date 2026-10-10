import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SiteHeaderComponent } from './site-header';

@Component({ template: '' })
class TestPageComponent {}

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [
        provideRouter([
          { path: 'login', component: TestPageComponent },
          { path: 'sign-up', component: TestPageComponent },
          { path: 'home', component: TestPageComponent }
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
});
