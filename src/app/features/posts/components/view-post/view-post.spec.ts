import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { ViewPostComponent } from './view-post';

const post: Post = {
  id: 7,
  title: 'A useful post title',
  body: 'Post body content for search previews.'
};

describe('ViewPostComponent', () => {
  let fixture: ComponentFixture<ViewPostComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '7' })) }
        },
        {
          provide: PostService,
          useValue: { getPost: () => of(post) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPostComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('renders the post and applies post-specific SEO metadata', () => {
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);

    expect(fixture.nativeElement.textContent).toContain(post.title);
    expect(fixture.nativeElement.textContent).toContain(post.body);
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');
    expect(title.getTitle()).toBe('A useful post title | Signal CRUD Demo');
    expect(meta.getTag('name="description"')?.content).toBe(post.body);
    expect(meta.getTag('property="og:type"')?.content).toBe('article');
  });
});
