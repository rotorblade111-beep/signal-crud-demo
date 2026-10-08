import { Routes } from '@angular/router';
import { PostListComponent } from './features/posts/components/post-list/post-list';
import { AddPostComponent } from './features/posts/components/add-post/add-post';
import { EditPostComponent } from './features/posts/components/edit-post/edit-post';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: PostListComponent },
  { path: 'add-post', component: AddPostComponent },
  { path: 'edit-post/:id', component: EditPostComponent },
  { path: '**', redirectTo: '/home' },
];