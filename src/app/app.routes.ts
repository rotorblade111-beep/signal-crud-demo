import { Routes } from '@angular/router';
import { PostListComponent } from './features/posts/components/post-list/post-list';

export const routes: Routes = [
  { path: '', component: PostListComponent } // Loads PostListComponent at http://localhost:4200/
];