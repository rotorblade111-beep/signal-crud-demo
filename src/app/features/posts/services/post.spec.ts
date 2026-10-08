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

  it('creates and prepends a post containing both title and body', () => {
    service.createPost(initialPost);
    const request = httpTesting.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(initialPost);
    request.flush(initialPost);

    expect(service.posts()).toEqual([initialPost]);
  });

  it('updates a post title without losing its body', () => {
    service.posts.set([initialPost]);
    service.updatePost(1, { title: 'Updated title' });
    const request = httpTesting.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('PUT');
    request.flush({ ...initialPost, title: 'Updated title' });

    expect(service.posts()).toEqual([{ ...initialPost, title: 'Updated title' }]);
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
