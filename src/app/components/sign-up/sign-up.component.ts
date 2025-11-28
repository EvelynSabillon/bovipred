// src/app/components/sign-up/sign-up.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterData } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit {
  // Datos del formulario
  formData = {
    name: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'asistente' as 'admin' | 'veterinario' | 'asistente',
    password: '',
    password_confirmation: ''
  };

  // Estado del componente
  loading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;
  acceptTerms: boolean = false;

  // Validaciones en tiempo real
  validations = {
    name: { valid: true, message: '' },
    apellido: { valid: true, message: '' },
    email: { valid: true, message: '' },
    password: { valid: true, message: '' },
    confirmPassword: { valid: true, message: '' }
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    // Limpiar errores previos
    this.hideError();

    // Validar formulario
    if (!this.validateForm()) {
      return;
    }

    // Validar términos y condiciones
    if (!this.acceptTerms) {
      this.showErrorMessage('Debes aceptar los términos y condiciones');
      return;
    }

    this.loading = true;

    const registerData: RegisterData = {
      name: this.formData.name.trim(),
      apellido: this.formData.apellido.trim(),
      email: this.formData.email.trim().toLowerCase(),
      password: this.formData.password,
      password_confirmation: this.formData.password_confirmation,
      rol: this.formData.rol,
      telefono: this.formData.telefono.trim() || undefined
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        
        // Redirigir al dashboard con mensaje de éxito
        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/dashboard'], {
            state: { message: '¡Registro exitoso! Bienvenido a BoviPred' }
          });
        }, 500);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.loading = false;
        
        // Manejar errores de validación del backend
        if (error.error?.errors) {
          const backendErrors = error.error.errors;
          let errorMsg = 'Error de validación:\n';
          
          Object.keys(backendErrors).forEach(key => {
            errorMsg += `• ${backendErrors[key][0]}\n`;
          });
          
          this.showErrorMessage(errorMsg);
        } else {
          this.showErrorMessage(error.message || 'Error al registrar usuario');
        }
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;

    // Validar nombre
    if (!this.formData.name || this.formData.name.trim().length < 2) {
      this.validations.name = {
        valid: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      };
      isValid = false;
    } else {
      this.validations.name = { valid: true, message: '' };
    }

    // Validar apellido
    if (!this.formData.apellido || this.formData.apellido.trim().length < 2) {
      this.validations.apellido = {
        valid: false,
        message: 'El apellido debe tener al menos 2 caracteres'
      };
      isValid = false;
    } else {
      this.validations.apellido = { valid: true, message: '' };
    }

    // Validar email
    if (!this.isValidEmail(this.formData.email)) {
      this.validations.email = {
        valid: false,
        message: 'Ingrese un email válido'
      };
      isValid = false;
    } else {
      this.validations.email = { valid: true, message: '' };
    }

    // Validar contraseña
    if (this.formData.password.length < 8) {
      this.validations.password = {
        valid: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      };
      isValid = false;
    } else if (!this.isStrongPassword(this.formData.password)) {
      this.validations.password = {
        valid: false,
        message: 'La contraseña debe contener letras y números'
      };
      isValid = false;
    } else {
      this.validations.password = { valid: true, message: '' };
    }

    // Validar confirmación de contraseña
    if (this.formData.password !== this.formData.password_confirmation) {
      this.validations.confirmPassword = {
        valid: false,
        message: 'Las contraseñas no coinciden'
      };
      isValid = false;
    } else {
      this.validations.confirmPassword = { valid: true, message: '' };
    }

    if (!isValid) {
      this.showErrorMessage('Por favor corrija los errores en el formulario');
    }

    return isValid;
  }

  // Validación en tiempo real del email
  onEmailBlur(): void {
    if (this.formData.email) {
      this.validations.email = {
        valid: this.isValidEmail(this.formData.email),
        message: this.isValidEmail(this.formData.email) ? '' : 'Email inválido'
      };
    }
  }

  // Validación en tiempo real de la contraseña
  onPasswordBlur(): void {
    if (this.formData.password) {
      const isValid = this.formData.password.length >= 8 && 
                     this.isStrongPassword(this.formData.password);
      this.validations.password = {
        valid: isValid,
        message: isValid ? '' : 'Contraseña débil'
      };
    }
  }

  // Validación en tiempo real de confirmación
  onConfirmPasswordBlur(): void {
    if (this.formData.password_confirmation) {
      const isValid = this.formData.password === this.formData.password_confirmation;
      this.validations.confirmPassword = {
        valid: isValid,
        message: isValid ? '' : 'Las contraseñas no coinciden'
      };
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // Al menos una letra y un número
    return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  }

  getPasswordStrength(): string {
    const password = this.formData.password;
    if (!password) return '';
    
    if (password.length < 8) return 'weak';
    if (password.length < 12 && this.isStrongPassword(password)) return 'medium';
    if (password.length >= 12 && this.isStrongPassword(password)) return 'strong';
    
    return 'weak';
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    
    setTimeout(() => {
      this.hideError();
    }, 8000);
  }

  hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }
}