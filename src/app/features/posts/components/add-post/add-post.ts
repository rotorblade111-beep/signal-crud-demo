import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostTitleInputComponent } from '../post-title-input/post-title-input';

@Component({
  selector: 'app-add-post',
  imports: [FormsModule, PostTitleInputComponent, RouterLink],
  templateUrl: './add-post.html'
})
export class AddPostComponent {
  private postService = inject(PostService);
  private router = inject(Router);

  newTitle = '';
  newBody = '';
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  constructor() {
    this.postService.loadPosts();
  }

  addPost(): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.postService.createPost({
      id: Date.now(),
      title: this.newTitle,
      body: this.newBody
    }).subscribe({
      next: () => {
        this.newTitle = '';
        this.newBody = '';
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/home');
      },
      error: (error: unknown) => {
        console.error('Failed to create post', error);
        this.submitError.set('Could not add the post. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
