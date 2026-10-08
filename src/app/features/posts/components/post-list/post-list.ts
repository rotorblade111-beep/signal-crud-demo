import { Component, inject, OnInit, effect, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { PostItemComponent } from '../post-item/post-item';
import { PostTitleInputComponent } from '../post-title-input/post-title-input';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';



@Component({
  selector: 'app-post-list',
  imports: [FormsModule, PostTitleInputComponent, PostItemComponent],
  templateUrl: './post-list.html',
})
export class PostListComponent implements OnInit {
  postService = inject(PostService);
  newTitle = '';
  newBody = '';
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

  addPost(): void {
    const title = this.newTitle;
    this.postService.createPost({
      id: Date.now(),  // Using timestamp as a temporary ID for demonstration
      title: title,
      body: this.newBody
    });
    
    this.newTitle = '';
    this.newBody = '';
  }

  editPost(post:Post): void {;
    const updatedTitle = prompt('Enter new title:', post.title);
    const postId: number = post.id;
    if (updatedTitle) {
      this.postService.updatePost(postId, { title: updatedTitle });
    }
  }

  removePost(id: number): void {
    this.postService.deletePost(id);
  }
}