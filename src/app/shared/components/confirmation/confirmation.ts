import { Component, input } from '@angular/core';

export interface Buttons {
  name: string;
  cssClass?: string;
  action?: () => void;
}

@Component({
  selector: 'app-confirmation',
  standalone: true,
  templateUrl: './confirmation.html'
})
export class ConfirmationComponent {
  message = input.required<string>();
  buttons = input.required<Buttons[]>();
}
