import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PostListComponent } from './features/posts/components/post-list/post-list';
import { AddPostComponent } from './features/posts/components/add-post/add-post';
import { EditPostComponent } from './features/posts/components/edit-post/edit-post';
import { ViewPostComponent } from './features/posts/components/view-post/view-post';
import { LoginComponent } from './features/auth/login/login';
import { SignUpComponent } from './features/auth/sign-up/sign-up';
import { authGuard } from './core/auth/auth.guard';
import { Post } from './features/posts/models/post.model';
import { PostService } from './features/posts/services/post.service';

export interface RouteSeoData {
  title: string;
  description: string;
  type: string;
}

export interface ViewPostRouteData extends RouteSeoData {
  post: Post | null;
  errorMessage: string | null;
}

const siteDescription = 'Browse and manage posts in the Signal CRUD Demo.';

const viewPostResolver: ResolveFn<ViewPostRouteData> = route => {
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

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    data: { seo: { title: 'Log in | Posthub', description: 'Log in to your Posthub account.', type: 'website' } }
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    data: { seo: { title: 'Sign up | Posthub', description: 'Create your Posthub account.', type: 'website' } }
  },
  {
    path: 'home',
    component: PostListComponent,
    canActivate: [authGuard],
    data: { seo: { title: 'Posts | Posthub', description: siteDescription, type: 'website' } }
  },
  {
    path: 'add-post',
    component: AddPostComponent,
    canActivate: [authGuard],
    data: { seo: { title: 'Add a post | Posthub', description: 'Create a new post on Posthub.', type: 'website' } }
  },
  {
    path: 'edit-post/:id',
    component: EditPostComponent,
    canActivate: [authGuard],
    data: { seo: { title: 'Edit post | Posthub', description: 'Edit a post on Posthub.', type: 'website' } }
  },
  {
    path: 'view-post/:id',
    component: ViewPostComponent,
    canActivate: [authGuard],
    resolve: { seo: viewPostResolver }
  },
  { path: '**', redirectTo: '/home' },
];