import { inject, Injectable, signal, computed, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private apiUrl = 'https://jsonplaceholder.typicode.com/posts';

  // State managed via Signals
  posts = signal<Post[]>([]);

  // Computed Signal: Derived directly from posts signal
  postCount = computed(() => this.posts().length);
  private hasLoadedPosts = false;


  loadPosts() {
    if (this.hasLoadedPosts) {
      return;
    }

    this.hasLoadedPosts = true;
    this.http.get<Post[]>(`${this.apiUrl}`).subscribe({
       next: (data) => this.posts.set(data),
       error: (err) => {
         this.hasLoadedPosts = false;
         console.error('Failed to fetch posts', err);
       }
    });
  }

  getPost(id: number): Observable<Post> {
    const cachedPost = this.posts().find(post => post.id === id);
    if (cachedPost) {
      return of(cachedPost);
    }

    return this.http.get<Post>(`${this.apiUrl}/${id}`).pipe(
      tap(post => {
        this.posts.update(current => [
          ...current.filter(item => item.id !== post.id),
          post
        ]);
      })
    );
  }

  createPost(newPost: Post): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, newPost).pipe(
      tap((createdPost) => {
        console.log('Post created:', createdPost);
        this.posts.update(current => [createdPost, ...current]);
      })
    );
  }

  updatePost(id: number, updatedData: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${id}`, updatedData).pipe(
      tap(() => {
        this.posts.update(current =>
          current.map(item => item.id === id ? { ...item, ...updatedData } : item)
        );
      })
    );
  }

  deletePost(id: number): void {
    console.log(`Deleting post with ID: ${id}`);
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.posts.update(current => current.filter(item => item.id !== id));
      }
    });
  }
}