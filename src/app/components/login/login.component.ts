// src/app/components/login/login.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  // Datos del formulario
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  
  // Estado del componente
  loading: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Redirigir al dashboard si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Recuperar email si se guardó anteriormente (solo en navegador)
    if (this.isBrowser) {
      const savedEmail = localStorage.getItem('bovipred_remember_email');
      if (savedEmail) {
        this.email = savedEmail;
        this.rememberMe = true;
      }
    }
  }

  onSubmit(): void {
    // Limpiar mensajes de error previos
    this.hideError();
    
    // Validación básica
    if (!this.email || !this.password) {
      this.showErrorMessage('Por favor complete todos los campos');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.showErrorMessage('Por favor ingrese un email válido');
      return;
    }

    if (this.password.length < 6) {
      this.showErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Iniciar proceso de login
    this.loading = true;

    const credentials: LoginCredentials = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        
        // Guardar email si "Recordarme" está activado (solo en navegador)
        if (this.isBrowser) {
          if (this.rememberMe) {
            localStorage.setItem('bovipred_remember_email', this.email);
          } else {
            localStorage.removeItem('bovipred_remember_email');
          }
        }

        // Mostrar mensaje de éxito
        this.showSuccessAndRedirect();
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.loading = false;
        this.showErrorMessage(error.message || 'Error al iniciar sesión');
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    
    // Ocultar error después de 5 segundos
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  private showSuccessAndRedirect(): void {
    // Pequeño delay para mejor UX
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    }, 500);
  }

  // Método para demo/testing - remover en producción
  fillDemoCredentials(): void {
    this.email = 'admin@bovipred.com';
    this.password = 'admin12345';
  }
}