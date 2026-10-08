import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PostItemComponent } from './post-item';
import { Post } from '../../models/post.model';

describe('PostItemComponent', () => {
  let component: PostItemComponent;
  let fixture: ComponentFixture<PostItemComponent>;
  const post: Post = {
    id: 1,
    title: 'A post title',
    body: 'A post body'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostItemComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PostItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', post);
    fixture.detectChanges();
  });

  it('renders the post title and body', () => {
    expect(fixture.nativeElement.textContent).toContain('A post title');
    expect(fixture.nativeElement.textContent).toContain('A post body');
  });
});
