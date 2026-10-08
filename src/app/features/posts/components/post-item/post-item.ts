import { Component, computed, input , output} from '@angular/core';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-item',
  standalone: true,
  templateUrl: './post-item.html'
})
export class PostItemComponent {
  // Required signal input from parent
  post = input.required<Post>();
  edit = output<Post>();
  delete = output<number>();

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
    this.delete.emit(this.post().id!);
  }
}
