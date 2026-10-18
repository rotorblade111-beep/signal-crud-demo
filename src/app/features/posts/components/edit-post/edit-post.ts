import { Component, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';
import { PostInputComponent } from '../post-input/post-input';
import { PostInputModel } from '../post-input/post-input';

function postFromRouterState(state: unknown): Post | null {
  if (!state || typeof state !== 'object' || !('post' in state)) {
    return null;
  }

  const post = state.post;
  if (
    !post ||
    typeof post !== 'object' ||
    !('id' in post) ||
    !('title' in post) ||
    !('body' in post) ||
    !('createdAt' in post) ||
    typeof post.id !== 'number' ||
    typeof post.title !== 'string' ||
    typeof post.body !== 'string' ||
    typeof post.createdAt !== 'string'
  ) {
    return null;
  }

  return { id: post.id, title: post.title, body: post.body, createdAt: post.createdAt };
}

type PostResult =
  | { type: 'loaded'; post: Post }
  | { type: 'invalid' }
  | { type: 'error' };

@Component({
  selector: 'app-edit-post',
  imports: [PostInputComponent, RouterLink],
  templateUrl: './edit-post.html'
})
export class EditPostComponent {
  id = input<string>();
  private router = inject(Router);
  private location = inject(Location);
  private postService = inject(PostService);
  private saveRequests = new Subject<Pick<Post, 'id' | 'title' | 'body'>>();

  post = signal<Post | null>(null);
  postModel = signal<PostInputModel>({ title: '', body: '' });
  postForm = form(this.postModel, path => [
    required(path.title, { message: 'Title is required.' }),
    required(path.body, { message: 'Post body is required.' })
  ]);
  submitAttempted = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  navigationState = this.router.getCurrentNavigation()?.extras.state ?? this.location.getState();
  statePost = postFromRouterState(this.navigationState);
  postResult = toSignal(toObservable(this.id).pipe(filter((id): id is string => id !== undefined),
        map(id => Number(id)),
        distinctUntilChanged(),
        switchMap(id => {
          if (!Number.isSafeInteger(id) || id <= 0) {
            return of({ type: 'invalid' as const });
          }
          if (this.statePost?.id === id) {
            return of({ type: 'loaded' as const, post: this.statePost });
          }
          return this.postService.getPost(id).pipe(
            map(post => ({ type: 'loaded' as const, post })),
            catchError((error: unknown) => {
              console.error('Failed to load post for editing', error);
              return of({ type: 'error' as const });
            })
          );
        })
      ),
      { initialValue: null }
    );
  private saveResult = toSignal(
    this.saveRequests.pipe(
      switchMap(({ id, title, body }) => this.postService.updatePost(id, { title, body }).pipe(
        map(() => ({ success: true as const })),
        catchError((error: unknown) => {
          console.error('Failed to update post', error);
          return of({ success: false as const });
        })
      ))
    ),
    { initialValue: null }
  );

  constructor() {

    effect(() => {
      const result = this.postResult();
      if (!result) {
        return;
      }

      this.isLoading.set(false);
      if (result.type === 'loaded') {
        this.post.set(result.post);
        this.postModel.set({ title: result.post.title, body: result.post.body });
        this.errorMessage.set(null);
      } else if (result.type === 'invalid') {
        this.errorMessage.set('The requested post ID is invalid.');
      } else {
        this.errorMessage.set('Could not load this post. Please return to the post list.');
      }
    });

    effect(() => {
      const result = this.saveResult();
      if (!result) {
        return;
      }

      this.isSaving.set(false);
      if (result.success) {
        void this.router.navigateByUrl('/home');
      } else {
        this.errorMessage.set('Could not update the post. Please try again.');
      }
    });
  }

  get title(): string {
    return this.postModel().title;
  }

  set title(title: string) {
    this.postModel.update(model => ({ ...model, title }));
  }

  get body(): string {
    return this.postModel().body;
  }

  set body(body: string) {
    this.postModel.update(model => ({ ...model, body }));
  }

  savePost(event?: Event): void {
    event?.preventDefault();
    this.submitAttempted.set(true);
    const post = this.post();
    if (!post || this.isSaving() || !this.postForm().valid()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.saveRequests.next({
      id: post.id,
      title: this.postModel().title,
      body: this.postModel().body
    });
  }
}
