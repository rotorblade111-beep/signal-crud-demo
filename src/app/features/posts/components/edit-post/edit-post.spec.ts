import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
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
        provideRouter([{ path: 'home', component: PostListComponent }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditPostComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    httpTesting.expectOne(`${apiUrl}/7`).flush(post);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('loads the selected post and saves its updated title and body', async () => {
    const homeLink = fixture.nativeElement.querySelector('a[routerLink="/home"]') as HTMLAnchorElement;
    expect(homeLink.textContent).toContain('Home');

    const titleInput = fixture.nativeElement.querySelector('input[name="title"]') as HTMLInputElement;
    const bodyInput = fixture.nativeElement.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
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

});
