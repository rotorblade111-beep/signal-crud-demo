import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { SnackbarService } from '../../shared/components/snackbar/snackbar.service';

export const apiStatusInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);

  return next(req).pipe(
    tap({
      next: () => {
        // Customize success messaging based on the action
        const actionText = req.method === 'GET' ? 'Data Loaded successfully' : 'Request completed Successfully';
        snackbar.show(`Success: ${req.method} ${actionText}`, 'success');
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.statusText || 'Server error occurred';
        snackbar.show(`Error (${error.status || 'Network'}): ${errorMsg}`, 'error');
      }
    })
  );
};