import { Component, inject, OnInit,effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { PostItemComponent } from '../post-item/post-item';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-list',
  imports: [FormsModule, PostItemComponent],
  templateUrl: './post-list.html',
  styleUrl: './post-list.css'
})
export class PostListComponent implements OnInit {
  postService = inject(PostService);
  newTitle: string|null = '';

  postList = toSignal(toObservable(this.postService.posts), {
    initialValue: []
  });

   postCount = computed(()=>this.postList().length);

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
    const title = this.newTitle as string;
    this.postService.createPost({
      id: Date.now(),  // Using timestamp as a temporary ID for demonstration
      title: title,
      body: 'Sample post body created via Angular Signals.'
    });
    
    this.newTitle = '';
  }

  editPost(post:Post): void {;
    const updatedTitle = prompt('Enter new title:', post.title);
    const postId:number = post.id;
    if (updatedTitle) {
      this.postService.updatePost(postId, { title: updatedTitle });
    }
  }

  removePost(id: number): void {
    this.postService.deletePost(id);
  }
}