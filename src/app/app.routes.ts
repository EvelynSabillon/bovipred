// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Componentes de Autenticación
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';

// Componentes Principales
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AnimalsDetailsComponent } from './components/animals-details/animals-details.component';
import { IatfComponent } from './components/iatf/iatf.component';
import { PredictionComponent } from './components/prediction/prediction.component';
import { ReportsComponent } from './components/reports/reports.component';

// Guards
import { authGuard, guestGuard, adminGuard, veterinarioGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ==================== RUTAS PÚBLICAS (Solo para NO autenticados) ====================
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Iniciar Sesión - BoviPred'
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    canActivate: [guestGuard],
    title: 'Crear Cuenta - BoviPred'
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    title: 'Cambiar Contraseña - BoviPred'
  },

  // ==================== RUTAS PROTEGIDAS (Requieren autenticación) ====================
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Dashboard - BoviPred'
  },
  {
    path: 'animals',
    component: AnimalsDetailsComponent,
    canActivate: [authGuard],
    title: 'Gestión de Animales - BoviPred'
  },
  {
    path: 'iatf',
    component: IatfComponent,
    canActivate: [authGuard],
    title: 'IATF - BoviPred'
  },
  {
    path: 'prediction',
    component: PredictionComponent,
    canActivate: [authGuard],
    title: 'Predicciones - BoviPred'
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard],
    title: 'Reportes - BoviPred'
  },


  // ==================== REDIRECCIONES Y RUTAS POR DEFECTO ====================
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Ruta 404 - Página no encontrada
  {
    path: '**',
    redirectTo: '/dashboard'
    // O puedes crear un componente 404:
    // loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];