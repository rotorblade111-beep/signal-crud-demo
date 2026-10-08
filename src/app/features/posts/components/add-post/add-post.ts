import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { PostService } from '../../services/post.service';
import { PostTitleInputComponent } from '../post-title-input/post-title-input';

@Component({
  selector: 'app-add-post',
  imports: [FormsModule, PostTitleInputComponent, RouterLink],
  templateUrl: './add-post.html'
})
export class AddPostComponent {
  private postService = inject(PostService);
  private router = inject(Router);
  private createRequests = new Subject<{ id: number; title: string; body: string }>();

  newTitle = '';
  newBody = '';
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  private createResult = toSignal(
    this.createRequests.pipe(
      switchMap(post => this.postService.createPost(post).pipe(
        map(() => ({ success: true as const })),
        catchError((error: unknown) => {
          console.error('Failed to create post', error);
          return of({ success: false as const });
        })
      ))
    ),
    { initialValue: null }
  );

  constructor() {
    this.postService.loadPosts();
    effect(() => {
      const result = this.createResult();
      if (!result) {
        return;
      }

      this.isSubmitting.set(false);
      if (result.success) {
        this.newTitle = '';
        this.newBody = '';
        void this.router.navigateByUrl('/home');
      } else {
        this.submitError.set('Could not add the post. Please try again.');
      }
    });
  }

  addPost(): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.createRequests.next({
      id: Date.now(),
      title: this.newTitle,
      body: this.newBody
    });
  }
}
