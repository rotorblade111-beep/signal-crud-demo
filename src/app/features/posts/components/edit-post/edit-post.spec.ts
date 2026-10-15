import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EditPostComponent } from './edit-post';
import { PostListComponent } from '../post-list/post-list';
import { Post } from '../../models/post.model';

const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
const post: Post = {
  id: 7,
  title: 'Original title',
  body: 'Original body stays unchanged'
};

describe('EditPostComponent', () => {
  let fixture: ComponentFixture<EditPostComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'home', component: PostListComponent }])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditPostComponent);
    fixture.componentRef.setInput('id', '7');
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    httpTesting.expectOne(apiUrl).flush([]);
    fixture.detectChanges();
    httpTesting.expectOne(`${apiUrl}/7`).flush(post);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('loads the selected post and saves its updated title and body', async () => {
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');

    const titleInput = fixture.nativeElement.querySelector('#post-title') as HTMLInputElement;
    const bodyInput = fixture.nativeElement.querySelector('#post-body') as HTMLTextAreaElement;
    expect(titleInput.value).toBe('Original title');
    expect(bodyInput.value).toBe('Original body stays unchanged');

    titleInput.value = 'Updated title';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    bodyInput.value = 'Updated body content';
    bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    const request = httpTesting.expectOne(`${apiUrl}/7`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      title: 'Updated title',
      body: 'Updated body content'
    });
    request.flush({
      ...post,
      title: 'Updated title',
      body: 'Updated body content'
    });

    await fixture.whenStable();
    expect(router.url).toBe('/home');
  });

  it('uses a matching post from router state without fetching it again', () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(Location), 'getState').mockReturnValue({ post });
    fixture = TestBed.createComponent(EditPostComponent);
    fixture.componentRef.setInput('id', String(post.id));
    fixture.detectChanges();

    expect(fixture.componentInstance.post()).toEqual(post);
    expect(fixture.componentInstance.title).toBe(post.title);
    expect(fixture.componentInstance.body).toBe(post.body);
    expect(fixture.componentInstance.isLoading()).toBe(false);
    httpTesting.expectNone(`${apiUrl}/7`);
  });

  it('shows required messages and highlights both fields when submitted empty', () => {
    const title = fixture.nativeElement.querySelector('#post-title') as HTMLInputElement;
    const body = fixture.nativeElement.querySelector('#post-body') as HTMLTextAreaElement;
    title.value = '';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    body.value = '';
    body.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    submit.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSaving()).toBe(false);
    httpTesting.expectNone(`${apiUrl}/7`);
    expect(fixture.nativeElement.textContent).toContain('Title is required.');
    expect(fixture.nativeElement.textContent).toContain('Post body is required.');
    expect(title.classList).toContain('!border-red-500');
    expect(body.classList).toContain('!border-red-500');
  });

});
