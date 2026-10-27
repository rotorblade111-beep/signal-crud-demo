import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from '../../models/post.model';
import { ConfirmationComponent, Buttons } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [DatePipe, RouterLink, ConfirmationComponent],
  templateUrl: './post-item.html'
})
export class PostItemComponent {
  // Required signal input from parent
  post = input.required<Post>();
  edit = output<Post>();
  delete = output<number>();
  showDeleteConfirmation = signal(false);

  // Derived state computed directly from the input signal!
  titleDisplay = computed(() => {
    const title = this.post().title;
    return title;
  });

  // Confirmation buttons defined in the component — actions fully encapsulated here
  confirmationButtons = computed<Buttons[]>(() => [
    { name: 'Delete', cssClass: 'cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:scale-[0.98] bg-blue-600 text-white hover:bg-blue-700',   action: () => this.confirmDelete() },
    { name: 'Cancel', cssClass: 'cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:scale-[0.98] bg-slate-100 text-slate-700 hover:bg-slate-200', action: () => this.cancelDelete() }
  ]);

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
