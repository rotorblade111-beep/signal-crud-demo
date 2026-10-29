import { Component, inject } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  templateUrl: './snackbar.component.html',
  styles: [`
    @keyframes shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
    .animate-progress-bar {
      animation: shrink linear forwards;
      transform-origin: left;
    }
  `]
})
export class SnackbarComponent {
  snackbarService = inject(SnackbarService);
}