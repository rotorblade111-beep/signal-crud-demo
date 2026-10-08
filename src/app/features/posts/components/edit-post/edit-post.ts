import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-edit-post',
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-post.html'
})
export class EditPostComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);

  post = signal<Post | null>(null);
  title = '';
  body = '';
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.isLoading.set(false);
      this.errorMessage.set('The requested post ID is invalid.');
      return;
    }

    this.postService.getPost(id).subscribe({
      next: post => {
        this.post.set(post);
        this.title = post.title;
        this.body = post.body;
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load post for editing', error);
        this.errorMessage.set('Could not load this post. Please return to the post list.');
        this.isLoading.set(false);
      }
    });
  }

  savePost(): void {
    const post = this.post();
    if (!post || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.postService.updatePost(post.id, {
      title: this.title,
      body: this.body
    }).subscribe({
      next: () => {
        void this.router.navigateByUrl('/home');
      },
      error: (error: unknown) => {
        console.error('Failed to update post', error);
        this.errorMessage.set('Could not update the post. Please try again.');
        this.isSaving.set(false);
      }
    });
  }
}
