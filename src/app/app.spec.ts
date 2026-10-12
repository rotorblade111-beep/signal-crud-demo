import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { App } from './app';

@Component({ template: '' })
class MetadataTestPage {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          {
            path: 'metadata-test',
            component: MetadataTestPage,
            data: {
              seo: {
                title: 'Metadata Test | Posthub',
                description: 'A test page description.',
                type: 'website'
              }
            }
          }
        ])
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should render the shared Posthub header and footer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-site-header')).not.toBeNull();
    expect(compiled.querySelector('app-site-footer')).not.toBeNull();
    expect(compiled.textContent).toContain('Posthub');
    expect(compiled.textContent).toContain('Quick Links');
    expect(compiled.textContent).toContain('Stay Updated');
  });

  it('applies route metadata centrally when navigation completes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/metadata-test');
    fixture.detectChanges();

    const meta = TestBed.inject(Meta);
    expect(TestBed.inject(Title).getTitle()).toBe('Metadata Test | Posthub');
    expect(meta.getTag('name="description"')?.content).toBe('A test page description.');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
  });
});
