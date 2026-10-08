import { Component, inject, OnInit, effect, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostItemComponent } from '../post-item/post-item';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';



@Component({
  selector: 'app-post-list',
  imports: [FormsModule, RouterLink, PostItemComponent],
  templateUrl: './post-list.html',
})
export class PostListComponent implements OnInit {
  postService = inject(PostService);
  private router = inject(Router);
  titleSearch = signal('');
  bodySearch = signal('');

  postList = toSignal(toObservable(this.postService.posts), {
    initialValue: []
  });

  postCount = computed(() => this.postList().length);
  filteredPosts = computed(() => {
    const titleQuery = this.titleSearch().trim().toLocaleLowerCase();
    const bodyQuery = this.bodySearch().trim().toLocaleLowerCase();

    return this.postList().filter(post =>
      post.title.toLocaleLowerCase().includes(titleQuery) &&
      post.body.toLocaleLowerCase().includes(bodyQuery)
    );
  });

  constructor() {
    // Registered inside constructor (Injection Context)
    this.postService.loadPosts();
    effect(() => {

      const currentCount = this.postService.postCount();
      console.log(`[Effect Triggered] Post count changed to: ${currentCount}`);
    });
  }

  ngOnInit(): void {
    // this.postService.loadPosts();
  }

  editPost(post: Post): void {
    void this.router.navigate(['/edit-post', post.id]);
  }

  removePost(id: number): void {
    this.postService.deletePost(id);
  }
}