import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-view-post',
  imports: [RouterLink],
  templateUrl: './view-post.html'
})
export class ViewPostComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private titleService = inject(Title);
  private meta = inject(Meta);

  post = signal<Post | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        this.post.set(null);
        this.errorMessage.set(null);
        this.isLoading.set(true);

        if (!Number.isSafeInteger(id) || id <= 0) {
          return of({ type: 'invalid' as const });
        }

        return this.postService.getPost(id).pipe(
          map(post => ({ type: 'post' as const, post })),
          catchError((error: unknown) => {
            console.error('Failed to load post details', error);
            return of({ type: 'error' as const });
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(result => {
      this.isLoading.set(false);

      if (result.type === 'invalid') {
        this.errorMessage.set('The requested post ID is invalid.');
      } else if (result.type === 'error') {
        this.errorMessage.set('Could not load this post. Please return to the post list.');
      } else {
        this.post.set(result.post);
        this.updateMetadata(result.post);
      }
    });
  }

  ngOnDestroy(): void {
    this.titleService.setTitle('Signal CRUD Demo');
    this.updateMetaTags({
      description: 'Browse and manage posts in the Signal CRUD Demo.',
      title: 'Signal CRUD Demo',
      type: 'website'
    });
  }

  private updateMetadata(post: Post): void {
    const title = `${post.title} | Signal CRUD Demo`;
    const description = post.body.replace(/\s+/g, ' ').trim().slice(0, 160)
      || `Read post ${post.id} in the Signal CRUD Demo.`;

    this.titleService.setTitle(title);
    this.updateMetaTags({ description, title, type: 'article' });
  }

  private updateMetaTags(values: { description: string; title: string; type: string }): void {
    this.meta.updateTag({ name: 'description', content: values.description });
    this.meta.updateTag({ property: 'og:title', content: values.title });
    this.meta.updateTag({ property: 'og:description', content: values.description });
    this.meta.updateTag({ property: 'og:type', content: values.type });
    this.meta.updateTag({ name: 'twitter:title', content: values.title });
    this.meta.updateTag({ name: 'twitter:description', content: values.description });
  }
}
