import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

export interface PostInputModel {
  title: string;
  body: string;
}

@Component({
  selector: 'app-post-input',
  standalone: true,
  imports: [FormField],
  templateUrl: './post-input.html'
})
export class PostInputComponent {
  fields = input.required<FieldTree<PostInputModel>>();
}
