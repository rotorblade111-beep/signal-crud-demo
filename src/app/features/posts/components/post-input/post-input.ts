import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './post-input.html'
})
export class PostInputComponent {
  title = model('');
  body = model('');
}
