import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ViewPostRouteData } from "../models/seo.model";
import { PostService } from '../../features/posts/services/post.service';

export const viewPostResolver: ResolveFn<ViewPostRouteData> = route => {
  const id = Number(route.paramMap.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return of({
      title: 'Post unavailable | Posthub',
      description: 'The requested post could not be found.',
      type: 'article',
      post: null,
      errorMessage: 'The requested post ID is invalid.'
    });
  }

  return inject(PostService).getPost(id).pipe(
    map(post => ({
      title: `${post.title} | Posthub`,
      description: post.body.replace(/\s+/g, ' ').trim().slice(0, 160)
        || `Read post ${post.id} in Posthub.`,
      type: 'article',
      post,
      errorMessage: null
    })),
    catchError((error: unknown) => {
      console.error('Failed to resolve post metadata', error);
      return of({
        title: 'Post unavailable | Posthub',
        description: 'The requested post could not be loaded.',
        type: 'article',
        post: null,
        errorMessage: 'Could not load this post. Please return to the post list.'
      });
    })
  );
};