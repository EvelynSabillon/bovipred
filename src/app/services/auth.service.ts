// src/app/services/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// Interfaces
export interface User {
  id: number;
  name: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'veterinario' | 'asistente';
  telefono?: string;
  activo: boolean;
  ultimo_acceso?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
  };
  errors?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  apellido: string;
  email: string;
  password: string;
  password_confirmation: string;
  rol?: 'admin' | 'veterinario' | 'asistente';
  telefono?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpdateProfileData {
  name: string;
  apellido: string;
  email: string;
  telefono?: string;
  password?: string;
  password_confirmation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // Usar URL del environment
  private tokenKey = 'bovipred_auth_token';
  private userKey = 'bovipred_user';
  private isBrowser: boolean;
  
  // BehaviorSubject para mantener el estado del usuario autenticado
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Inicializar estado de autenticación solo en el navegador
    if (this.isBrowser) {
      const user = this.getUserFromStorage();
      const hasToken = this.hasToken();
      
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(hasToken);
      
      // Solo verificar token si existe y estamos en el navegador
      if (hasToken) {
        this.checkTokenValidity();
      }
    }
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Login de usuario
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.saveAuthData(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Registro de nuevo usuario
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.saveAuthData(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout de usuario
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }),
      catchError(err => {
        // Limpiar datos locales incluso si la petición falla
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Actualizar perfil del usuario
   */
  updateProfile(data: UpdateProfileData): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/auth/profile`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveUser(response.data as any); // Actualizar usuario en localStorage
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(data: ChangePasswordData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/change-password`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Actualizar token después de cambiar contraseña
          this.saveToken(response.data.token);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Listar usuarios (solo admin)
   */
  listUsers(params?: { rol?: string; activo?: boolean }): Observable<any> {
    let queryParams = '';
    if (params) {
      const urlParams = new URLSearchParams();
      if (params.rol) urlParams.append('rol', params.rol);
      if (params.activo !== undefined) urlParams.append('activo', params.activo.toString());
      queryParams = '?' + urlParams.toString();
    }

    return this.http.get(`${this.apiUrl}/auth/users${queryParams}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Activar/Desactivar usuario (solo admin)
   */
  toggleUserStatus(userId: number): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/users/${userId}/toggle`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken() && this.currentUserSubject.value !== null;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'admin';
  }

  /**
   * Verificar si el usuario es veterinario
   */
  isVeterinario(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'veterinario' || user?.rol === 'admin';
  }

  /**
   * Obtener rol del usuario
   */
  getUserRole(): string | null {
    return this.getCurrentUser()?.rol || null;
  }

  /**
   * Guardar datos de autenticación
   */
  private saveAuthData(token: string, user: User): void {
    this.saveToken(token);
    this.saveUser(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Guardar token en localStorage
   */
  private saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  /**
   * Guardar usuario en localStorage
   */
  private saveUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  /**
   * Verificar si hay token
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtener usuario de localStorage
   */
  private getUserFromStorage(): User | null {
    if (this.isBrowser) {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtener headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verificar validez del token
   */
  private checkTokenValidity(): void {
    if (this.hasToken()) {
      this.getProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.saveUser(response.data);
          }
        },
        error: (error) => {
          // Solo limpiar datos si es un error 401 (no autorizado)
          if (error.status === 401) {
            console.warn('Token expirado o inválido, limpiando sesión');
            this.clearAuthData();
          } else {
            // Para otros errores (red, servidor), mantener la sesión
            console.warn('Error al validar token, manteniendo sesión local:', error);
          }
        }
      });
    }
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para esta acción';
      } else if (error.status === 422) {
        errorMessage = 'Error de validación';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('Error en AuthService:', error);
    return throwError(() => new Error(errorMessage));
  }
}