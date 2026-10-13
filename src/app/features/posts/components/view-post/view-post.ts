import { Component, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ViewPostRouteData } from '../../../../app.routes';

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
    typeof post.id !== 'number' ||
    typeof post.title !== 'string' ||
    typeof post.body !== 'string'
  ) {
    return null;
  }

  return { id: post.id, title: post.title, body: post.body };
}

@Component({
  selector: 'app-view-post',
  imports: [RouterLink],
  templateUrl: './view-post.html'
})
export class ViewPostComponent {
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? this.location.getState();
    const statePost = postFromRouterState(navigationState);
    this.statePost = statePost?.id === id ? statePost : null;

    effect(() => {
      const data = this.routeData();
      if (!data) {
        if (!this.statePost) {
          this.isLoading.set(true);
        }
        return;
      }

      this.post.set(this.statePost ?? data.post);
      this.errorMessage.set(this.statePost ? null : data.errorMessage);
      this.isLoading.set(false);
    });

    if (this.statePost) {
      this.post.set(this.statePost);
      this.isLoading.set(false);
    }
  }
}
