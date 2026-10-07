import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-title-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './post-title-input.html',
  styleUrl: './post-title-input.css'
})
export class PostTitleInputComponent {
  title = model('');
}
