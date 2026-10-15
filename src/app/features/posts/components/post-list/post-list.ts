import { Component, effect, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostItemComponent } from '../post-item/post-item';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';
import { Subject, catchError, map, mergeMap, of } from 'rxjs';



@Component({
  selector: 'app-post-list',
  imports: [RouterLink, PostItemComponent],
  templateUrl: './post-list.html',
})
export class PostListComponent  {
  readonly pageSize = 10;
  postService = inject(PostService);
  private router = inject(Router);
  private deleteRequests = new Subject<number>();
  titleSearch = signal('');
  bodySearch = signal('');
  currentPage = signal(1);
  deleteError = signal<string | null>(null);

  private deleteResult = toSignal(
    this.deleteRequests.pipe(
      mergeMap(id => this.postService.deletePost(id).pipe(
        map(() => ({ success: true as const })),
        catchError((error: unknown) => {
          console.error(`Failed to delete post ${id}`, error);
          return of({ success: false as const });
        })
      ))
    ),
    { initialValue: null }
  );

  postList = toSignal(toObservable(this.postService.posts), {
    initialValue: []
  });

  postCount = computed(() => this.postList().length);
  filteredPosts = computed(() => {
    const titleQuery = this.titleSearch().trim().toLocaleLowerCase();
    const bodyQuery = this.bodySearch().trim().replace(/\s+/g, ' ').toLocaleLowerCase();

    return this.postList().filter(post =>
      post.title.toLocaleLowerCase().includes(titleQuery) &&
      post.body.replace(/\s+/g, ' ').toLocaleLowerCase().includes(bodyQuery)
    );
  });
  totalPages = computed(() => Math.ceil(this.filteredPosts().length / this.pageSize));
  displayedPage = computed(() => Math.min(this.currentPage(), Math.max(this.totalPages(), 1)));
  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );
  paginatedPosts = computed(() => {
    const start = (this.displayedPage() - 1) * this.pageSize;
    return this.filteredPosts().slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      const result = this.deleteResult();
      if (result) {
        this.deleteError.set(
          result.success ? null : 'Could not delete the post. Please try again.'
        );
      }
    });
  }

  editPost(post: Post): void {
    void this.router.navigate(['/edit-post', post.id], { state: { post } });
  }

  removePost(id: number): void {
    this.deleteError.set(null);
    this.deleteRequests.next(id);
  }

  setTitleSearch(value: string): void {
    this.titleSearch.set(value);
    this.currentPage.set(1);
  }

  setBodySearch(value: string): void {
    this.bodySearch.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}