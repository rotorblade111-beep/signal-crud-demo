import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }
  if (auth.currentUser()) {
    return true;
  }
  return auth.restoreSession().pipe(
    map(user => user
      ? true
      : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }))
  );
};
