import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from '../../models/post.model';
import { ConfirmationComponent } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [RouterLink, ConfirmationComponent],
  templateUrl: './post-item.html'
})
export class PostItemComponent {
  // Required signal input from parent
  post = input.required<Post>();
  edit = output<Post>();
  delete = output<number>();
  showDeleteConfirmation = signal(false);

  // Optional signal input with a default value
 // highlight = input<boolean>(false);

  // Derived state computed directly from the input signal!
  titleDisplay = computed(() => {
    const title = this.post().title;
    return title;
  });


  onEdit(): void {
    this.edit.emit(this.post());
  }

  onDelete(): void {
    this.showDeleteConfirmation.set(true);
  }

  confirmDelete(): void {
    this.showDeleteConfirmation.set(false);
    this.delete.emit(this.post().id!);
  }

  cancelDelete(): void {
    this.showDeleteConfirmation.set(false);
  }
}
