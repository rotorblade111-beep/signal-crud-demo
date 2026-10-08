import { Routes } from '@angular/router';
import { PostListComponent } from './features/posts/components/post-list/post-list';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: PostListComponent },
];