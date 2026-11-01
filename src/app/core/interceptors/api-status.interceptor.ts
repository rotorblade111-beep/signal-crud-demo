import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { SnackbarService } from '../../shared/components/snackbar/snackbar.service';

const actionMessages: Record<string, string> = {
  POST: 'Data Saved successfully',
  PUT: 'Data Updated successfully',
  DELETE: 'Data Deleted successfully',
};


export const apiStatusInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);
  const actionText = actionMessages[req.method];

  return next(req).pipe(
    tap({
      next: () => {
        // Customize success messaging based on the action
        if(actionText) {
          snackbar.show(`Success: ${req.method} ${actionText}`, 'success');
        }
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.statusText || 'Server error occurred';
        snackbar.show(`Error (${error.status || 'Network'}): ${errorMsg}`, 'error');
      }
    })
  );
};