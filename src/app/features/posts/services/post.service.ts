import { inject, Injectable, signal, computed, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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


  loadPosts() {
    this.http.get<Post[]>(`${this.apiUrl}`).subscribe({
       next: (data) => this.posts.set(data),
       error: (err) => console.error('Failed to fetch posts', err)
    });
  }

  createPost(newPost: Post): void {
    this.http.post<Post>(this.apiUrl, newPost).subscribe({
      next: (createdPost) => {
        console.log('Post created:', createdPost);
        this.posts.update(current => [createdPost, ...current]);
      }
    });
  }

  updatePost(id: number, updatedData: Partial<Post>): void {
    this.http.put<Post>(`${this.apiUrl}/${id}`, updatedData).subscribe({
      next: () => {
        this.posts.update(current =>
          current.map(item => item.id === id ? { ...item, ...updatedData } : item)
        );
      }
    });
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