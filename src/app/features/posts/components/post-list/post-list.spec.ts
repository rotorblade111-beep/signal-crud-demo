import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PostListComponent } from './post-list';
import { Post } from '../../models/post.model';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;
  let httpTesting: HttpTestingController;
  const posts: Post[] = [
    { id: 1, title: 'Alpha headline', body: 'Red apples in this body' },
    { id: 2, title: 'Beta headline', body: 'Blue ocean in this body' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    httpTesting.expectOne('https://jsonplaceholder.typicode.com/posts').flush(posts);
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

});
