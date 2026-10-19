import { Component, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ViewPostRouteData } from '../../../../core/models/seo.model';

function postFromRouterState(state: unknown): ViewPostRouteData['post'] {
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

@Component({
  selector: 'app-view-post',
  imports: [RouterLink],
  templateUrl: './view-post.html'
})
export class ViewPostComponent {
  id = input<string>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private statePost: ViewPostRouteData['post'] = null;

  post = signal<ViewPostRouteData['post']>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  private routeData = toSignal(
    this.route.data.pipe(map(data => data['seo'] as ViewPostRouteData)),
    { initialValue: null }
  );

  constructor() {
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? this.location.getState();
    this.statePost = postFromRouterState(navigationState);

    effect(() => {
      const id = Number(this.id());
      const statePost = this.statePost?.id === id ? this.statePost : null;
      const data = this.routeData();
      if (!data) {
        if (!statePost) {
          this.isLoading.set(true);
        } else {
          this.post.set(statePost);
          this.errorMessage.set(null);
          this.isLoading.set(false);
        }
        return;
      }

      this.post.set(statePost ?? data.post);
      this.errorMessage.set(statePost ? null : data.errorMessage);
      this.isLoading.set(false);
    });
  }
}
