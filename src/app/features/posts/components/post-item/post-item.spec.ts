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

  it('only emits the delete event after confirmation', () => {
    const deleted = vi.fn();
    component.delete.subscribe(deleted);
    fixture.nativeElement.querySelector('button:last-child').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "Are you sure you want to delete this post? This action can't be undone."
    );
    expect(deleted).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('app-confirmation button:last-child').click();
    fixture.detectChanges();
    expect(deleted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-confirmation')).toBeNull();

    fixture.nativeElement.querySelector('button:last-child').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('app-confirmation button:first-child').click();
    fixture.detectChanges();

    expect(deleted).toHaveBeenCalledOnce();
    expect(deleted).toHaveBeenCalledWith(post.id);
    expect(fixture.nativeElement.querySelector('app-confirmation')).toBeNull();
  });
});
