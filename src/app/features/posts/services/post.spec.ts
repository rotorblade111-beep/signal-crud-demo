import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { Post } from '../models/post.model';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let httpTesting: HttpTestingController;
  const apiUrl = 'http://localhost:5093/posts';
  const initialPost: Post = {
    id: 1,
    title: 'Original title',
    body: 'Original body',
    createdAt: '2026-10-18T10:30:00+00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.inject(AuthService).clearSession();
    service = TestBed.inject(PostService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  const flushInitialPosts = async (posts: Post[] = []): Promise<void> => {
    httpTesting.expectOne(apiUrl).flush(posts);
    await TestBed.inject(ApplicationRef).whenStable();
  };

  it('loads posts with their title and body', async () => {
    await flushInitialPosts([initialPost]);

    expect(service.posts()).toEqual([initialPost]);
    expect(service.postCount()).toBe(1);
  });

  it('does not refetch posts when the signal is read repeatedly', async () => {
    await flushInitialPosts([initialPost]);

    expect(service.posts()).toEqual([initialPost]);
    expect(service.posts()).toEqual([initialPost]);
    httpTesting.expectNone(apiUrl);
  });

  it('fetches posts for the selected user and supports unfiltered all-post requests', async () => {
    await flushInitialPosts([initialPost]);

    service.loadPosts(42);
    httpTesting.expectOne(`${apiUrl}?userId=42`).flush([initialPost]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(service.posts()).toEqual([initialPost]);

    service.loadPosts(null);
    httpTesting.expectOne(apiUrl).flush([initialPost]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(service.posts()).toEqual([initialPost]);
  });

  it('does not overwrite a local create while the initial post request is still in flight', async () => {
    const createdPost: Post = {
      ...initialPost,
      id: 2,
      title: 'Created during load'
    };
    service.createPost({ title: createdPost.title, body: createdPost.body }).subscribe();
    httpTesting.expectOne(request => request.url === apiUrl && request.method === 'POST').flush(createdPost);
    await TestBed.inject(ApplicationRef).whenStable();

    httpTesting.expectOne(request => request.url === apiUrl && request.method === 'GET').flush([initialPost]);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.posts()).toEqual([createdPost]);
  });

  it('includes the user ID in paginated requests when provided', () => {
    httpTesting.expectOne(apiUrl).flush([]);
    service.getPaginatedPosts(20, 10, 42).subscribe();
    const request = httpTesting.expectOne(`${apiUrl}?offset=20&limit=10&userId=42`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads a post by ID when it is not cached', async () => {
    await flushInitialPosts();
    service.getPost(1).subscribe(post => expect(post).toEqual(initialPost));
    httpTesting.expectOne(`${apiUrl}/1`).flush(initialPost);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.posts()).toEqual([initialPost]);
  });

  it('uses a cached post without another API request', async () => {
    await flushInitialPosts();
    service.posts.set([initialPost]);
    service.getPost(1).subscribe(post => expect(post).toEqual(initialPost));

    httpTesting.expectNone(`${apiUrl}/1`);
  });

  it('creates and prepends a post containing both title and body', async () => {
    await flushInitialPosts();
    const newPost = { title: initialPost.title, body: initialPost.body };
    service.createPost(newPost).subscribe();
    const request = httpTesting.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(newPost);
    request.flush(initialPost);

    expect(service.posts()).toEqual([initialPost]);
  });

  it('updates a post title and body', async () => {
    await flushInitialPosts();
    service.posts.set([initialPost]);
    const updatedPost = {
      ...initialPost,
      title: 'Updated title',
      body: 'Updated body'
    };
    service.updatePost(1, {
      title: updatedPost.title,
      body: updatedPost.body
    }).subscribe();
    const request = httpTesting.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      title: 'Updated title',
      body: 'Updated body'
    });
    request.flush(updatedPost);

    expect(service.posts()).toEqual([updatedPost]);
  });

  it('removes a deleted post from the list', async () => {
    await flushInitialPosts();
    service.posts.set([initialPost]);
    service.deletePost(1).subscribe();
    const request = httpTesting.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});

    expect(service.posts()).toEqual([]);
  });
});
