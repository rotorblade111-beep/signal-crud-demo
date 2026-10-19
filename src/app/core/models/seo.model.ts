import { Post } from '../../features/posts/models/post.model';

export interface RouteSeoData {
  title: string;
  description: string;
  type: string;
}

export interface ViewPostRouteData extends RouteSeoData {
  post: Post | null;
  errorMessage: string | null;
}