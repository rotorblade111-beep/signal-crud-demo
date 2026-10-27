import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const backendOrigin = 'http://localhost:5093';

export const apiCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  const requestUrl = new URL(request.url, globalThis.location?.origin ?? backendOrigin);
  const auth = inject(AuthService);

  // Only attach credentials / auth headers to our own backend
  const isBackendRequest = requestUrl.origin === backendOrigin;
  if (!isBackendRequest) {
    return next(request);
  }

  const isAuthEndpoint = requestUrl.pathname.startsWith('/auth/');
  const authenticatedRequest = request.clone({
    withCredentials: true,
    ...(!isAuthEndpoint && auth.accessToken()
      ? { setHeaders: { Authorization: `Bearer ${auth.accessToken()}` } }
      : {})
  });

  if (isAuthEndpoint) {
    return next(authenticatedRequest);
  }

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap(response => next(request.clone({
          withCredentials: true,
          setHeaders: { Authorization: `Bearer ${response.accessToken}` }
        }))),
        catchError(() => throwError(() => error))
      );
    })
  );
};
