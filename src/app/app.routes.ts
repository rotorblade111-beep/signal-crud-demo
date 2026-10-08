import { Routes } from '@angular/router';
import { PostListComponent } from './features/posts/components/post-list/post-list';
import { AddPostComponent } from './features/posts/components/add-post/add-post';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: PostListComponent },
  { path: 'add-post', component: AddPostComponent },
  { path: '**', redirectTo: '/home' },
];