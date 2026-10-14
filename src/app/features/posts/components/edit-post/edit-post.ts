import { Component, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';
import { PostInputComponent } from '../post-input/post-input';

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
    typeof post.id !== 'number' ||
    typeof post.title !== 'string' ||
    typeof post.body !== 'string'
  ) {
    return null;
  }

  return { id: post.id, title: post.title, body: post.body };
}

type PostResult =
  | { type: 'loaded'; post: Post }
  | { type: 'invalid' }
  | { type: 'error' };

@Component({
  selector: 'app-edit-post',
  imports: [FormsModule, PostInputComponent, RouterLink],
  templateUrl: './edit-post.html'
})
export class EditPostComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private postService = inject(PostService);
  private saveRequests = new Subject<{ id: number; title: string; body: string }>();

  post = signal<Post | null>(null);
  title = '';
  body = '';
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? this.location.getState();
    const statePost = postFromRouterState(navigationState);
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.isLoading.set(false);
      this.errorMessage.set('The requested post ID is invalid.');
    } else if (statePost?.id === id) {
      this.post.set(statePost);
      this.title = statePost.title;
      this.body = statePost.body;
      this.isLoading.set(false);
    } else {
      const postResult = toSignal(
        this.postService.getPost(id).pipe(
          map(post => ({ type: 'loaded' as const, post })),
          catchError((error: unknown) => {
            console.error('Failed to load post for editing', error);
            return of({ type: 'error' as const });
          })
        ),
        { initialValue: null }
      );

      effect(() => {
        const result = postResult();
        if (!result) {
          return;
        }

        this.isLoading.set(false);
        if (result.type === 'loaded') {
          this.post.set(result.post);
          this.title = result.post.title;
          this.body = result.post.body;
        } else {
          this.errorMessage.set('Could not load this post. Please return to the post list.');
        }
      });
    }

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

  savePost(): void {
    const post = this.post();
    if (!post || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.saveRequests.next({
      id: post.id,
      title: this.title,
      body: this.body
    });
  }
}
