import { inject, Injectable, signal, computed, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpParams } from '@angular/common/http';
import { Observable, of, Subject, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:5093/posts';
  private activeUserId = this.auth.currentUser()?.id ?? null;
  private requestedUserIds = new Subject<number | null>();

  // 1. Declarative fetch converted automatically to a signal via toSignal()
  // This triggers automatically upon service creation without manual .subscribe() or guard flags.
  private fetchedPosts = toSignal(
    this.requestedUserIds.pipe(
      startWith(this.auth.currentUser()?.id ?? null),
      distinctUntilChanged(),
      switchMap(userId => this.getPosts(userId))
    ),
    { initialValue: [] }
  );

  // 2. Writable state signal for local CRUD operations (.set / .update)
  posts = signal<Post[]>([]);

  // 3. Computed Signal: Derived directly from posts signal
  postCount = computed(() => this.posts().length);

  constructor() {
    effect(() => {
      const data = this.fetchedPosts();
      if (data.length > 0 && untracked(() => this.posts().length === 0)) {
        this.posts.set(data);
      }
    });
  }

  loadPosts(userId: number | null): void {
    if (this.activeUserId !== userId) {
      this.activeUserId = userId;
      this.posts.set([]);
    }
    this.requestedUserIds.next(userId);
  }

  getPaginatedPosts(offset: number, limit: number, userId: number | null = null): Observable<Post[]> {
    let params = new HttpParams().set('offset', offset).set('limit', limit);
    if (userId !== null) {
      params = params.set('userId', userId);
    }
    return this.http.get<Post[]>(this.apiUrl, { params });
  }

  getPosts(userId: number | null = null): Observable<Post[]> {
    const params = userId === null
      ? undefined
      : new HttpParams().set('userId', userId);
    return this.http.get<Post[]>(this.apiUrl, { params });
  }

  getPost(id: number): Observable<Post> {
    const cachedPost = this.posts().find(post => post.id === id);
    if (cachedPost) {
      return of(cachedPost);
    }

    return this.http.get<Post>(`${this.apiUrl}/${id}`).pipe(
      tap(post => {
        this.posts.update(current => [
          ...current.filter(item => item.id !== id),
          post
        ]);
      })
    );
  }

  createPost(newPost: Omit<Post, 'id' | 'createdAt'>): Observable<Post> {
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

  // Refactored deletePost: returns an Observable instead of calling .subscribe() internally
  deletePost(id: number): Observable<void> {
    console.log(`Deleting post with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.posts.update(current => current.filter(item => item.id !== id));
      })
    );
  }
}