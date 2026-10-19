import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { viewPostResolver } from './core/resolvers/view-post.resolver';

const siteDescription = 'Browse and manage posts in the Signal CRUD Demo.';



export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    data: { seo: { title: 'Log in | Posthub', description: 'Log in to your Posthub account.', type: 'website' } }
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./features/auth/sign-up/sign-up').then(m => m.SignUpComponent),
    data: { seo: { title: 'Sign up | Posthub', description: 'Create your Posthub account.', type: 'website' } }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    data: { seo: { title: 'Reset password | Posthub', description: 'Reset your Posthub account password.', type: 'website' } }
  },
  {
    path: 'home',
    loadComponent: () => import('./features/posts/components/post-list/post-list').then(m => m.PostListComponent),
    canActivate: [authGuard],
    data: { seo: { title: 'Posts | Posthub', description: siteDescription, type: 'website' } }
  },
  {
    path: 'add-post',
    loadComponent: () => import('./features/posts/components/add-post/add-post').then(m => m.AddPostComponent),
    canActivate: [authGuard],
    data: { seo: { title: 'Add a post | Posthub', description: 'Create a new post on Posthub.', type: 'website' } }
  },
  {
    path: 'edit-post/:id',
    loadComponent: () => import('./features/posts/components/edit-post/edit-post').then(m => m.EditPostComponent),
    canActivate: [authGuard],
    data: { seo: { title: 'Edit post | Posthub', description: 'Edit a post on Posthub.', type: 'website' } }
  },
  {
    path: 'view-post/:id',
    loadComponent: () => import('./features/posts/components/view-post/view-post').then(m => m.ViewPostComponent),
    canActivate: [authGuard],
    resolve: { seo: viewPostResolver },
  },
  { path: '**', redirectTo: '/home' },
];