import { Component, inject, computed, signal, OnDestroy, AfterViewInit, input, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PostItemComponent } from '../post-item/post-item';
import { PostFilters, PostFiltersComponent } from '../post-filters/post-filters';
import { PostPaginationComponent } from '../post-pagination/post-pagination';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';
import { Subject, catchError, map, mergeMap, of, tap } from 'rxjs';



@Component({
  selector: 'app-post-list',
  imports: [RouterLink, PostFiltersComponent, PostItemComponent, PostPaginationComponent],
  templateUrl: './post-list.html',
})
export class PostListComponent implements OnDestroy, AfterViewInit {
  userId = input<string>();
  // private timerId: any;
  // handleTimeout(): void {
  //   for(let i = 1; i < 11; i++) {
  //   this.postService.getPaginatedPosts(i,10,this.selectedUserId()).subscribe((res) => {
  //     console.log('Initial paginated posts:', res);
  //     });
  //   }
  // }
  readonly pageSize = 10;
  postService = inject(PostService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private deleteRequests = new Subject<number>();
  serverPaginatedPosts = signal<Post[] | null>(null);
  filterDraft = signal<PostFilters>({ author: '', title: '', body: '', createdFrom: '', createdTo: '' });
  filters = signal<PostFilters>({ author: '', title: '', body: '', createdFrom: '', createdTo: '' });
  currentPage = signal(1);
  deleteError = signal<string | null>(null);
  isPersonalFeed = computed(() => this.userId() !== undefined);
  isPersonalFeedAuthorized = computed(() => {
    if (!this.isPersonalFeed()) {
      return true;
    }

    const userId = Number(this.userId());
    return Number.isSafeInteger(userId) &&
      userId > 0 &&
      userId === this.authService.currentUser()?.id;
  });
  isContentNotFound = computed(() => this.isPersonalFeed() && !this.isPersonalFeedAuthorized());
  selectedUserId = computed(() => {
    return this.isPersonalFeedAuthorized() && this.isPersonalFeed()
      ? Number(this.userId())
      : null;
  });

  private loadSelectedUserPosts = effect(() => {
    this.currentPage.set(1);
    this.serverPaginatedPosts.set(null);
    if (!this.isContentNotFound()) {
      this.postService.loadPosts(this.selectedUserId());
    }
  });

  private deleteResult = toSignal(
    this.deleteRequests.pipe(
      mergeMap(id => this.postService.deletePost(id).pipe(
        tap(() => {
            this.loadPaginatedPosts();
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
    const { author, title, body, createdFrom, createdTo } = this.filters();
    const authorQuery = author.trim().toLocaleLowerCase();
    const titleQuery = title.trim().toLocaleLowerCase();
    const bodyQuery = body.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

    return this.postList().filter(post =>
      (post.authorEmail ?? 'Unknown author').toLocaleLowerCase().includes(authorQuery) &&
      post.title.toLocaleLowerCase().includes(titleQuery) &&
      post.body.replace(/\s+/g, ' ').toLocaleLowerCase().includes(bodyQuery) &&
      this.matchesCreatedDate(post.createdAt, createdFrom, createdTo)
    );
  });
  totalPages = computed(() => Math.ceil(this.filteredPosts().length / this.pageSize));
  displayedPage = computed(() => Math.min(this.currentPage(), Math.max(this.totalPages(), 1)));
  hasActiveFilters = computed(() => {
    const { author, title, body, createdFrom, createdTo } = this.filters();
    return !!(author.trim() || title.trim() || body.trim() || createdFrom || createdTo);
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

  ngAfterViewInit(): void {
  //  this.timerId = setTimeout(() => {
  //   this.handleTimeout();
  //   }, 90000);
  }

  ngOnDestroy(): void {
    //clearTimeout(this.timerId);
  }

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
  }

  loadPaginatedPosts(page: number = this.displayedPage()): void {
    const offset = (page - 1) * this.pageSize;
    this.postService.getPaginatedPosts(offset, this.pageSize, this.selectedUserId()).subscribe({
      next: (posts) => {
        this.serverPaginatedPosts.set(posts);
      },
      error: (err) => {
        console.error('Failed to load paginated posts', err);
      }
    });
  }

  handlePageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPaginatedPosts(page);
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