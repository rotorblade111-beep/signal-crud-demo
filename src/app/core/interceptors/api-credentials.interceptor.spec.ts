import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiCredentialsInterceptor } from './api-credentials.interceptor';

describe('apiCredentialsInterceptor', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiCredentialsInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('includes cookies for requests to the backend API', () => {
    const http = TestBed.inject(HttpClient);
    http.get('http://localhost:5093/posts').subscribe();

    const request = httpTesting.expectOne('http://localhost:5093/posts');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('does not include cookies for other origins', () => {
    const http = TestBed.inject(HttpClient);
    http.get('https://example.com/data').subscribe();

    const request = httpTesting.expectOne('https://example.com/data');
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });
});
