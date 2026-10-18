import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
