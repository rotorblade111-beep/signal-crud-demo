import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Post } from '../../models/post.model';
import { ViewPostComponent } from './view-post';

const post: Post = {
  id: 7,
  title: 'A useful post title',
  body: 'Post body content for search previews.'
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
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the post data resolved by the route', () => {
    expect(fixture.nativeElement.textContent).toContain(post.title);
    expect(fixture.nativeElement.textContent).toContain(post.body);
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');
  });
});
