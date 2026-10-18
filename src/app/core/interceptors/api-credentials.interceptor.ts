import { HttpInterceptorFn } from '@angular/common/http';

const backendOrigin = 'http://localhost:5093';

export const apiCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (new URL(request.url, globalThis.location?.origin ?? backendOrigin).origin !== backendOrigin) {
    return next(request);
  }

  return next(request.clone({ withCredentials: true }));
};
