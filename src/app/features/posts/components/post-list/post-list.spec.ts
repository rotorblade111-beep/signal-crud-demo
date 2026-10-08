import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostListComponent } from './post-list';
import { Post } from '../../models/post.model';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;
  let httpTesting: HttpTestingController;
  const posts: Post[] = [
    { id: 1, title: 'Alpha headline', body: 'Red apples in this body' },
    { id: 2, title: 'Beta headline', body: 'Blue ocean in this body' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    httpTesting.expectOne('https://jsonplaceholder.typicode.com/posts').flush(posts);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  it('should create and load posts including their bodies', () => {
    expect(component).toBeTruthy();
    expect(component.postService.posts()).toEqual(posts);
  });

  it('filters by title and body independently and combines both criteria', async () => {
    component.titleSearch.set('alpha');
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[0]]);

    component.titleSearch.set('');
    component.bodySearch.set('BLUE OCEAN');
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[1]]);

    component.titleSearch.set('alpha');
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([]);
  });

  it('creates a post with its entered title and body, then clears both fields', async () => {
    fixture.detectChanges();
    const titleInput = fixture.nativeElement.querySelector(
      'app-post-title-input input'
    ) as HTMLInputElement;
    const bodyInput = fixture.nativeElement.querySelector(
      'app-post-title-input textarea'
    ) as HTMLTextAreaElement;
    titleInput.value = 'New headline';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    bodyInput.value = 'New body content';
    bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(component.newTitle).toBe('New headline');
    expect(component.newBody).toBe('New body content');
    component.addPost();

    const request = httpTesting.expectOne('https://jsonplaceholder.typicode.com/posts');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      title: 'New headline',
      body: 'New body content'
    });
    request.flush({ id: 3, title: 'New headline', body: 'New body content' });

    expect(component.newTitle).toBe('');
    expect(component.newBody).toBe('');
    expect(component.postService.posts()[0]).toEqual({
      id: 3,
      title: 'New headline',
      body: 'New body content'
    });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(titleInput.value).toBe('');
    expect(bodyInput.value).toBe('');
  });
});
