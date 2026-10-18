import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { PostItemComponent } from './post-item';
import { Post } from '../../models/post.model';

describe('PostItemComponent', () => {
  let component: PostItemComponent;
  let fixture: ComponentFixture<PostItemComponent>;
  const post: Post = {
    id: 1,
    title: 'A post title',
    body: 'A post body',
    createdAt: '2026-10-18T10:30:00+00:00'
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

  it('shows the post creation date beside the title', () => {
    const date = fixture.nativeElement.querySelector('time') as HTMLTimeElement;

    expect(date.getAttribute('datetime')).toBe(post.createdAt);
    expect(date.textContent.trim()).toBe('Oct 18, 2026');
  });

  it('passes the full post in router state when opening the detail page', () => {
    const link = fixture.debugElement.query(By.directive(RouterLink)).injector.get(RouterLink);

    expect(link.state).toEqual({ post });
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
