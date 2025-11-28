// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Interceptor para agregar automáticamente el token de autenticación 
 * a todas las peticiones HTTP y manejar errores de autenticación
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // Obtener token
  const token = authService.getToken();
  
  // Clonar la petición y agregar el token si existe
  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Enviar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (No autorizado) y estamos en el navegador
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        console.error('Sesión expirada o token inválido');
        
        // Limpiar localStorage y redirigir
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('bovipred_auth_token');
          localStorage.removeItem('bovipred_user');
        }
        
        router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' }
        });
      }
      
      // Si el error es 403 (Prohibido)
      if (error.status === 403 && isPlatformBrowser(platformId)) {
        console.error('No tienes permisos para esta acción');
        router.navigate(['/dashboard'], {
          state: { error: 'No tienes permisos para realizar esta acción' }
        });
      }
      
      return throwError(() => error);
    })
  );
};