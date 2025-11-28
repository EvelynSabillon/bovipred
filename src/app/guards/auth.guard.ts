// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar la URL a la que intentó acceder para redirigir después del login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * Guard para rutas que solo pueden acceder usuarios NO autenticados (login, registro)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Si ya está autenticado, redirigir al dashboard
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard para rutas que requieren rol de administrador
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Si no es admin, redirigir al dashboard con mensaje de error
  router.navigate(['/dashboard'], {
    state: { error: 'No tienes permisos para acceder a esta sección' }
  });
  
  return false;
};

/**
 * Guard para rutas que requieren rol de veterinario o superior
 */
export const veterinarioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isVeterinario()) {
    return true;
  }

  router.navigate(['/dashboard'], {
    state: { error: 'No tienes permisos para acceder a esta sección' }
  });
  
  return false;
};