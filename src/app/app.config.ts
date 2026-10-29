import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { apiCredentialsInterceptor } from './core/interceptors/api-credentials.interceptor';
import { apiStatusInterceptor } from './core/interceptors/api-status.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([apiCredentialsInterceptor, apiStatusInterceptor])),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideClientHydration(),
  ],
};
