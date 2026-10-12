import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ViewPostRouteData } from '../../../../app.routes';

@Component({
  selector: 'app-view-post',
  imports: [RouterLink],
  templateUrl: './view-post.html'
})
export class ViewPostComponent {
  private route = inject(ActivatedRoute);

  post = signal<ViewPostRouteData['post']>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  private routeData = toSignal(
    this.route.data.pipe(map(data => data['seo'] as ViewPostRouteData)),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      const data = this.routeData();
      if (!data) {
        this.isLoading.set(true);
        return;
      }

      this.post.set(data.post);
      this.errorMessage.set(data.errorMessage);
      this.isLoading.set(false);
    });
  }
}
