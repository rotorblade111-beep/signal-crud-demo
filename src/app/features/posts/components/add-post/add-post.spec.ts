import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AddPostComponent } from './add-post';
import { PostListComponent } from '../post-list/post-list';

const apiUrl = 'https://jsonplaceholder.typicode.com/posts';

describe('AddPostComponent', () => {
  let fixture: ComponentFixture<AddPostComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'home', component: PostListComponent },
          { path: 'add-post', component: AddPostComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddPostComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    httpTesting.expectOne(apiUrl).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('submits the title and body, then returns to the list route', async () => {
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');

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

    expect(fixture.componentInstance.newTitle).toBe('New headline');
    expect(fixture.componentInstance.newBody).toBe('New body content');

    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    const request = httpTesting.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      title: 'New headline',
      body: 'New body content'
    });
    request.flush({ id: 3, title: 'New headline', body: 'New body content' });

    await fixture.whenStable();
    expect(router.url).toBe('/home');
    expect(fixture.componentInstance.newTitle).toBe('');
    expect(fixture.componentInstance.newBody).toBe('');
  });

  it('keeps the form open and reports an API error', async () => {
    fixture.componentInstance.newTitle = 'Failed post';
    fixture.componentInstance.newBody = 'Body text';
    fixture.componentInstance.addPost();
    httpTesting.expectOne(apiUrl).flush(
      { message: 'Unavailable' },
      { status: 500, statusText: 'Server Error' }
    );
    await fixture.whenStable();

    expect(router.url).not.toBe('/home');
    expect(fixture.componentInstance.submitError()).toContain('Could not add the post');
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });
});
