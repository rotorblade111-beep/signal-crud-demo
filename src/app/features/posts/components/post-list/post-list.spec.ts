import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
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

    TestBed.inject(AuthService).clearSession();
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

  it('shows all posts on home and restricts the personalized feed to the authenticated user', async () => {
    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({ id: 7, email: 'author@example.com', dateOfBirth: '2000-01-01' });
    fixture.detectChanges();

    expect(component.selectedUserId()).toBeNull();
    expect(component.isContentNotFound()).toBe(false);
    expect(component.postList()).toEqual(posts);

    fixture.componentRef.setInput('userId', '7');
    fixture.detectChanges();
    const ownPosts = [{ ...posts[0], userId: 7, authorEmail: 'author@example.com' }];
    httpTesting.expectOne('http://localhost:5093/posts?userId=7').flush(ownPosts);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedUserId()).toBe(7);
    expect(component.postService.posts()).toEqual(ownPosts);
    expect(component.postList()).toEqual(ownPosts);

    fixture.componentRef.setInput('userId', '9');
    fixture.detectChanges();
    expect(component.selectedUserId()).toBeNull();
    expect(component.isContentNotFound()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Content not Found');
    httpTesting.expectNone('http://localhost:5093/posts?userId=9');
  });

  it('filters by title and body independently and combines both criteria', async () => {
    component.setFilterDraft({ ...component.filterDraft(), title: 'alpha' });
    component.applyFilters();
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[0]]);

    component.setFilterDraft({ ...component.filterDraft(), title: '', body: 'BLUE OCEAN' });
    component.applyFilters();
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[1]]);

    component.setFilterDraft({ ...component.filterDraft(), title: 'alpha' });
    component.applyFilters();
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([]);
  });

  it('does not change results until the search action is applied', async () => {
    component.setFilterDraft({ ...component.filterDraft(), title: 'alpha' });
    await fixture.whenStable();

    expect(component.filters().title).toBe('');
    expect(component.filteredPosts()).toEqual(posts);

    component.applyFilters();

    expect(component.filters().title).toBe('alpha');
    expect(component.filteredPosts()).toEqual([posts[0]]);
  });

  it('filters a single created date as an exact calendar day', async () => {
    component.setFilterDraft({
      ...component.filterDraft(),
      createdFrom: '2026-10-18',
      createdTo: '2026-10-18'
    });
    component.applyFilters();
    await fixture.whenStable();

    expect(component.filteredPosts()).toEqual([posts[0]]);

    component.setFilterDraft({ ...component.filterDraft(), createdFrom: '', createdTo: '2026-10-17' });
    component.applyFilters();
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[1]]);
  });

  it('returns no results for an invalid date range', async () => {
    component.setFilterDraft({
      ...component.filterDraft(),
      createdFrom: '2026-10-19',
      createdTo: '2026-10-18'
    });
    component.applyFilters();
    await fixture.whenStable();

    expect(component.filteredPosts()).toEqual([]);
  });

  it('filters an inclusive created-date range and combines it with text filters', async () => {
    component.setFilterDraft({
      ...component.filterDraft(),
      title: 'headline',
      createdFrom: '2026-10-17',
      createdTo: '2026-10-18'
    });
    component.applyFilters();
    await fixture.whenStable();

    expect(component.filteredPosts()).toEqual(posts);

    component.setFilterDraft({ ...component.filterDraft(), title: 'alpha' });
    component.applyFilters();
    await fixture.whenStable();
    expect(component.filteredPosts()).toEqual([posts[0]]);
  });

  it('matches body searches across line breaks and repeated whitespace', async () => {
    const multilinePost: Post = {
      id: 3,
      title: 'Multiline post',
      body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
      createdAt: '2026-10-16T10:30:00+00:00'
    };
    component.postService.posts.set([multilinePost]);

    component.setFilterDraft({
      ...component.filterDraft(),
      body: 'suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto'
    });
    component.applyFilters();
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

    component.currentPage.set(2);
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedPosts()).toHaveLength(10);
    expect(component.paginatedPosts()[0]).toEqual(hundredPosts[10]);

    component.currentPage.set(10);
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
    component.currentPage.set(8);

    component.setFilterDraft({ ...component.filterDraft(), body: 'needle' });
    component.applyFilters();

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
    component.currentPage.set(10);
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
    httpTesting.expectOne('http://localhost:5093/posts?offset=0&limit=10').flush([posts[1]]);
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

  it('keeps the displayed page in range as the current page changes', async () => {
    const thirtyPosts = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      title: `Post ${index + 1}`,
      body: `Body ${index + 1}`,
      createdAt: '2026-10-18T10:30:00+00:00'
    }));
    component.postService.posts.set(thirtyPosts);
    await fixture.whenStable();
    expect(component.totalPages()).toBe(3);
    expect(component.displayedPage()).toBe(1);
    component.currentPage.set(2);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.displayedPage()).toBe(2);
    component.currentPage.set(3);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.displayedPage()).toBe(3);
  });

  it('loads the selected server page when the pagination component emits a page change', async () => {
    component.handlePageChange(2);

    const request = httpTesting.expectOne('http://localhost:5093/posts?offset=10&limit=10');
    expect(request.request.method).toBe('GET');
    request.flush(posts);
    await fixture.whenStable();

    expect(component.currentPage()).toBe(2);
    expect(component.serverPaginatedPosts()).toEqual(posts);
  });

  it('includes the selected user ID when requesting a server-paginated page', async () => {
    TestBed.inject(AuthService).currentUser.set({
      id: 7,
      email: 'author@example.com',
      dateOfBirth: '2000-01-01'
    });
    fixture.componentRef.setInput('userId', '7');
    fixture.detectChanges();
    httpTesting.expectOne('http://localhost:5093/posts?userId=7').flush(posts);
    await fixture.whenStable();
    component.handlePageChange(2);

    const request = httpTesting.expectOne(
      'http://localhost:5093/posts?offset=10&limit=10&userId=7'
    );
    expect(request.request.method).toBe('GET');
    request.flush(posts);
    await fixture.whenStable();

    expect(component.currentPage()).toBe(2);
    expect(component.serverPaginatedPosts()).toEqual(posts);
  });

});
