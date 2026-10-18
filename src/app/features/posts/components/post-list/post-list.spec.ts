import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { PostListComponent } from './post-list';
import { Post } from '../../models/post.model';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;
  let httpTesting: HttpTestingController;
  const posts: Post[] = [
    { id: 1, title: 'Alpha headline', body: 'Red apples in this body', createdAt: '2026-10-18T10:30:00+00:00' },
    { id: 2, title: 'Beta headline', body: 'Blue ocean in this body', createdAt: '2026-10-17T10:30:00+00:00' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    httpTesting.expectOne('http://localhost:5093/posts').flush(posts);
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

  it('matches body searches across line breaks and repeated whitespace', async () => {
    const multilinePost: Post = {
      id: 3,
      title: 'Multiline post',
      body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
      createdAt: '2026-10-16T10:30:00+00:00'
    };
    component.postService.posts.set([multilinePost]);

    component.setBodySearch(
      'suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto'
    );
    await fixture.whenStable();

    expect(component.filteredPosts()).toEqual([multilinePost]);
  });

  it('shows at most 10 posts per page and navigates across all pages', async () => {
    const hundredPosts = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      title: `Post ${index + 1}`,
      body: `Body ${index + 1}`,
      createdAt: '2026-10-18T10:30:00+00:00'
    }));
    component.postService.posts.set(hundredPosts);
    await fixture.whenStable();

    expect(component.totalPages()).toBe(10);
    expect(component.paginatedPosts()).toHaveLength(10);
    expect(component.paginatedPosts()[0]).toEqual(hundredPosts[0]);
    expect(component.paginatedPosts()[9]).toEqual(hundredPosts[9]);

    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedPosts()).toHaveLength(10);
    expect(component.paginatedPosts()[0]).toEqual(hundredPosts[10]);

    component.goToPage(10);
    expect(component.paginatedPosts()[0]).toEqual(hundredPosts[90]);
    expect(component.paginatedPosts()[9]).toEqual(hundredPosts[99]);
  });

  it('resets pagination when a search changes and applies filters before slicing', async () => {
    const hundredPosts = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      title: `Post ${index + 1}`,
      body: index === 75 ? 'needle in body' : `Body ${index + 1}`,
      createdAt: '2026-10-18T10:30:00+00:00'
    }));
    component.postService.posts.set(hundredPosts);
    await fixture.whenStable();
    component.goToPage(8);

    component.setBodySearch('needle');

    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedPosts()).toEqual([hundredPosts[75]]);
  });

  it('keeps the displayed page valid if posts are removed from the last page', async () => {
    const hundredPosts = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      title: `Post ${index + 1}`,
      body: `Body ${index + 1}`,
      createdAt: '2026-10-18T10:30:00+00:00'
    }));
    component.postService.posts.set(hundredPosts);
    await fixture.whenStable();
    component.goToPage(10);
    component.postService.posts.set(hundredPosts.slice(0, 85));
    await fixture.whenStable();

    expect(component.displayedPage()).toBe(9);
    expect(component.paginatedPosts()).toHaveLength(5);
  });

  it('executes deletion and updates the displayed post list', async () => {
    component.removePost(posts[0].id);
    const request = httpTesting.expectOne('http://localhost:5093/posts/1');
    expect(request.request.method).toBe('DELETE');
    request.flush({});
    await fixture.whenStable();

    expect(component.postService.posts()).toEqual([posts[1]]);
    expect(component.postList()).toEqual([posts[1]]);
    expect(component.postCount()).toBe(1);
    expect(component.paginatedPosts()).toEqual([posts[1]]);
    expect(component.deleteError()).toBeNull();
  });

  it('reports deletion failures and leaves the post in the list', async () => {
    component.removePost(posts[0].id);
    httpTesting.expectOne('http://localhost:5093/posts/1').flush(
      { message: 'Unavailable' },
      { status: 500, statusText: 'Server Error' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.postService.posts()).toEqual(posts);
    expect(component.deleteError()).toContain('Could not delete the post');
    expect(fixture.nativeElement.textContent).toContain('Could not delete the post');
  });

  it('navigates to the edit-post route for the selected post', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.editPost(posts[1]);

    expect(navigateSpy).toHaveBeenCalledWith(['/edit-post', 2], { state: { post: posts[1] } });
  });

});
