import { Injectable, signal } from '@angular/core';

export type SnackbarType = 'success' | 'error';

export interface SnackbarData {
  message: string;
  type: SnackbarType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  snackbar = signal<SnackbarData | null>(null);
  private timeoutId: any = null;

  show(message: string, type: SnackbarType, duration = 3000): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.snackbar.set({ message, type, duration });

    this.timeoutId = setTimeout(() => {
      this.snackbar.set(null);
    }, duration);
  }
}