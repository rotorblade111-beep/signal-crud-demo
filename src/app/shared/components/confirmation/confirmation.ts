import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  templateUrl: './confirmation.html'
})
export class ConfirmationComponent {
  message = input.required<string>();
  confirmed = output<void>();
  cancelled = output<void>();
}
