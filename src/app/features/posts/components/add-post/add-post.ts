import { Component, effect, inject, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { PostService } from '../../services/post.service';
import { PostInputComponent } from '../post-input/post-input';
import { PostInputModel } from '../post-input/post-input';

@Component({
  selector: 'app-add-post',
  imports: [PostInputComponent, RouterLink],
  templateUrl: './add-post.html'
})
export class AddPostComponent {
  private postService = inject(PostService);
  private router = inject(Router);
  private createRequests = new Subject<{ title: string; body: string }>();

  postModel = signal<PostInputModel>({ title: '', body: '' });
  postForm = form(this.postModel, path => [
    required(path.title, { message: 'Title is required.' }),
    required(path.body, { message: 'Post body is required.' })
  ]);
  submitAttempted = signal(false);
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

  get newTitle(): string {
    return this.postModel().title;
  }

  set newTitle(title: string) {
    this.postModel.update(model => ({ ...model, title }));
  }

  get newBody(): string {
    return this.postModel().body;
  }

  set newBody(body: string) {
    this.postModel.update(model => ({ ...model, body }));
  }

  constructor() {
    effect(() => {
      const result = this.createResult();
      if (!result) {
        return;
      }

      this.isSubmitting.set(false);
      if (result.success) {
        this.postModel.set({ title: '', body: '' });
        void this.router.navigateByUrl('/home');
      } else {
        this.submitError.set('Could not add the post. Please try again.');
      }
    });
  }

  addPost(event?: Event): void {
    event?.preventDefault();
    this.submitAttempted.set(true);
    if (!this.postForm().valid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.createRequests.next({
      title: this.postModel().title,
      body: this.postModel().body
    });
  }
}
