import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 && error.error?.message?.toLowerCase().includes('suspendida')) {
        authService.clearSession();
        router.navigate(['/login'], {
          queryParams: { suspended: true },
        });
        return throwError(() => error);
      }

      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return authService.refresh().pipe(
            switchMap((res) => {
              isRefreshing = false;
              refreshSubject.next(res.accessToken);
              const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              });
              return next(cloned);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.clearSession();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            }),
          );
        } else {
          return refreshSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
              const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
              });
              return next(cloned);
            }),
          );
        }
      }

      let detail = 'Ocurrió un error inesperado';
      if (error.error?.message) {
        const msg = error.error.message;
        detail = Array.isArray(msg) ? msg[0] : msg;
      }
      console.error(`[ErrorInterceptor] ${error.status}: ${detail}`);

      return throwError(() => error);
    }),
  );
};
