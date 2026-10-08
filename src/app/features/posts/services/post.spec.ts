import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Post } from '../models/post.model';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let httpTesting: HttpTestingController;
  const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
  const initialPost: Post = {
    id: 1,
    title: 'Original title',
    body: 'Original body'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PostService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads posts with their title and body', () => {
    service.loadPosts();
    httpTesting.expectOne(apiUrl).flush([initialPost]);

    expect(service.posts()).toEqual([initialPost]);
    expect(service.postCount()).toBe(1);
  });

  it('does not refetch posts when the list route is revisited', () => {
    service.loadPosts();
    service.loadPosts();
    httpTesting.expectOne(apiUrl).flush([initialPost]);

    expect(service.posts()).toEqual([initialPost]);
  });

  it('loads a post by ID when it is not cached', () => {
    service.getPost(1).subscribe(post => expect(post).toEqual(initialPost));
    httpTesting.expectOne(`${apiUrl}/1`).flush(initialPost);

    expect(service.posts()).toEqual([initialPost]);
  });

  it('uses a cached post without another API request', () => {
    service.posts.set([initialPost]);
    service.getPost(1).subscribe(post => expect(post).toEqual(initialPost));

    httpTesting.expectNone(`${apiUrl}/1`);
  });

  it('creates and prepends a post containing both title and body', () => {
    service.createPost(initialPost).subscribe();
    const request = httpTesting.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(initialPost);
    request.flush(initialPost);

    expect(service.posts()).toEqual([initialPost]);
  });

  it('updates a post title and body', () => {
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

  it('removes a deleted post from the list', () => {
    service.posts.set([initialPost]);
    service.deletePost(1);
    const request = httpTesting.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});

    expect(service.posts()).toEqual([]);
  });
});
