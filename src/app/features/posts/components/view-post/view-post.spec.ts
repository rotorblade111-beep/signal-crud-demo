import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Post } from '../../models/post.model';
import { ViewPostComponent } from './view-post';

const post: Post = {
  id: 7,
  title: 'A useful post title',
  body: 'Post body content for search previews.',
  createdAt: '2026-10-18T10:30:00+00:00'
};

describe('ViewPostComponent', () => {
  let fixture: ComponentFixture<ViewPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPostComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              seo: {
                title: `${post.title} | Posthub`,
                description: post.body,
                type: 'article',
                post,
                errorMessage: null
              }
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPostComponent);
    fixture.componentRef.setInput('id', String(post.id));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the post data resolved by the route', () => {
    expect(fixture.nativeElement.textContent).toContain(post.title);
    expect(fixture.nativeElement.textContent).toContain(post.body);
    expect(fixture.nativeElement.textContent).toContain('By Unknown author');
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');
    const returnLink = fixture.nativeElement.querySelectorAll('a')[1] as HTMLAnchorElement;
    expect(returnLink.getAttribute('href')).toBe('/home');
    expect(returnLink.textContent).toContain('Return to Posts');
  });

  it('prefers the complete post supplied in router state', () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(Location), 'getState').mockReturnValue({
      post: { ...post, title: 'Post from router state' }
    });
    fixture = TestBed.createComponent(ViewPostComponent);
    fixture.componentRef.setInput('id', String(post.id));
    fixture.detectChanges();

    expect(fixture.componentInstance.post()?.title).toBe('Post from router state');
    expect(fixture.componentInstance.errorMessage()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Post from router state');
  });

  it('returns to the originating personalized feed and displays the author', () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(Location), 'getState').mockReturnValue({
      post: { ...post, authorEmail: 'author@example.com' },
      returnUrl: '/personal/7'
    });
    fixture = TestBed.createComponent(ViewPostComponent);
    fixture.componentRef.setInput('id', String(post.id));
    fixture.detectChanges();

    const returnLink = fixture.nativeElement.querySelectorAll('a')[1] as HTMLAnchorElement;
    expect(fixture.nativeElement.textContent).toContain('By author@example.com');
    expect(returnLink.getAttribute('href')).toBe('/personal/7');
    expect(returnLink.textContent).toContain('Return to Personalized Feed');
  });
});
