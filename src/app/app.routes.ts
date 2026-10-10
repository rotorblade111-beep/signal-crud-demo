import { Routes } from '@angular/router';
import { PostListComponent } from './features/posts/components/post-list/post-list';
import { AddPostComponent } from './features/posts/components/add-post/add-post';
import { EditPostComponent } from './features/posts/components/edit-post/edit-post';
import { ViewPostComponent } from './features/posts/components/view-post/view-post';
import { LoginComponent } from './features/auth/login/login';
import { SignUpComponent } from './features/auth/sign-up/sign-up';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'home', component: PostListComponent, canActivate: [authGuard] },
  { path: 'add-post', component: AddPostComponent, canActivate: [authGuard] },
  { path: 'edit-post/:id', component: EditPostComponent, canActivate: [authGuard] },
  { path: 'view-post/:id', component: ViewPostComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/home' },
];