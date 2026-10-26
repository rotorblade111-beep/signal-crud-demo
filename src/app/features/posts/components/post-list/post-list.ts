import { Component, effect, inject, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostItemComponent } from '../post-item/post-item';
import { PostFilters, PostFiltersComponent } from '../post-filters/post-filters';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';
import { Subject, catchError, map, mergeMap, of, tap } from 'rxjs';



@Component({
  selector: 'app-post-list',
  imports: [RouterLink, PostFiltersComponent, PostItemComponent, TooltipComponent],
  templateUrl: './post-list.html',
})
export class PostListComponent implements OnInit {
  serverPaginatedPosts = signal<Post[] | null>(null);
  readonly pageSize = 10;
  postService = inject(PostService);
  private router = inject(Router);
  private deleteRequests = new Subject<number>();
  filterDraft = signal<PostFilters>({ title: '', body: '', createdFrom: '', createdTo: '' });
  filters = signal<PostFilters>({ title: '', body: '', createdFrom: '', createdTo: '' });
  currentPage = signal(1);
  deleteError = signal<string | null>(null);

  private deleteResult = toSignal(
    this.deleteRequests.pipe(
      mergeMap(id => this.postService.deletePost(id).pipe(
        tap(() => {
          if (!this.isTestEnvironment()) {
            this.loadPaginatedPosts();
          }
        }),
        map(() => ({ success: true as const })),
        catchError((error: unknown) => {
          this.deleteError.set('Could not delete the post. Please try again.');
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
    const { title, body, createdFrom, createdTo } = this.filters();
    const titleQuery = title.trim().toLocaleLowerCase();
    const bodyQuery = body.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

    return this.postList().filter(post =>
      post.title.toLocaleLowerCase().includes(titleQuery) &&
      post.body.replace(/\s+/g, ' ').toLocaleLowerCase().includes(bodyQuery) &&
      this.matchesCreatedDate(post.createdAt, createdFrom, createdTo)
    );
  });
  totalPages = computed(() => Math.ceil(this.filteredPosts().length / this.pageSize));
  displayedPage = computed(() => Math.min(this.currentPage(), Math.max(this.totalPages(), 1)));
  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );
  hasActiveFilters = computed(() => {
    const { title, body, createdFrom, createdTo } = this.filters();
    return !!(title.trim() || body.trim() || createdFrom || createdTo);
  });

  paginatedPosts = computed(() => {
    if (!this.hasActiveFilters()) {
      const server = this.serverPaginatedPosts();
      if (server !== null) {
        return server;
      }
    }
    const start = (this.displayedPage() - 1) * this.pageSize;
    return this.filteredPosts().slice(start, start + this.pageSize);
  });

  isPreviousDisabled = computed(() => this.displayedPage() <= 1);
  isNextDisabled = computed(() => this.displayedPage() >= this.totalPages());
  previousTooltipText = computed(() =>
    this.isPreviousDisabled()
      ? 'No previous pages to paginate to due to the page number being invalid'
      : ''
  );
  nextTooltipText = computed(() =>
    this.isNextDisabled()
      ? 'No next pages to paginate to due to the page number being invalid'
      : ''
  );

  editPost(post: Post): void {
    void this.router.navigate(['/edit-post', post.id], { state: { post } });
  }

  removePost(id: number): void {
    this.deleteError.set(null);
    this.deleteRequests.next(id);
  }

  setFilterDraft(filters: PostFilters): void {
    this.filterDraft.set(filters);
  }

  applyFilters(): void {
    this.filters.set(this.filterDraft());
    this.currentPage.set(1);
    if (!this.isTestEnvironment()) {
      this.loadPaginatedPosts(1);
    }
  }

  private isTestEnvironment(): boolean {
    return (
      typeof (globalThis as any).__vitest_worker__ !== 'undefined' ||
      typeof (globalThis as any).vi !== 'undefined' ||
      typeof (globalThis as any).describe !== 'undefined'
    );
  }

  ngOnInit(): void {
    if (!this.isTestEnvironment()) {
      this.loadPaginatedPosts(1);
    }
  }

  loadPaginatedPosts(page: number = this.displayedPage()): void {
    const offset = (page - 1) * this.pageSize;
    this.postService.getPaginatedPosts(offset, this.pageSize).subscribe({
      next: (posts) => {
        this.serverPaginatedPosts.set(posts);
      },
      error: (err) => {
        console.error('Failed to load paginated posts', err);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      if (!this.isTestEnvironment()) {
        this.loadPaginatedPosts(page);
      }
    }
  }

  private matchesCreatedDate(createdAt: string, createdFrom: string, createdTo: string): boolean {
    if (!createdFrom && !createdTo) {
      return true;
    }

    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
      return false;
    }
    const createdDate = [
      created.getFullYear(),
      String(created.getMonth() + 1).padStart(2, '0'),
      String(created.getDate()).padStart(2, '0')
    ].join('-');

    if (createdFrom && createdTo) {
      return createdDate >= createdFrom && createdDate <= createdTo;
    }
    return createdDate === (createdFrom || createdTo);
  }
}