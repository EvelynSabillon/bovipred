// src/app/components/change-password/change-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ChangePasswordData, User } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  // Usuario actual
  currentUser: User | null = null;

  // Validación de email
  emailStep: boolean = true;
  email: string = '';
  emailVerified: boolean = false;

  // Datos del formulario
  formData = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  };

  // Estado del componente
  loading: boolean = false;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showError: boolean = false;
  showSuccess: boolean = false;

  // Validaciones
  validations = {
    currentPassword: { valid: true, message: '' },
    newPassword: { valid: true, message: '' },
    confirmPassword: { valid: true, message: '' }
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener usuario actual si está autenticado
    if (this.authService.isAuthenticated()) {
      this.currentUser = this.authService.getCurrentUser();
      this.emailStep = false;
      this.emailVerified = true;
    } else {
      // Requiere validación de email si no está autenticado
      this.emailStep = true;
      this.emailVerified = false;
    }
  }

  verifyEmail(): void {
    this.hideMessages();
    
    if (!this.email || !this.isValidEmail(this.email)) {
      this.showErrorMessage('Por favor ingrese un correo electrónico válido');
      return;
    }

    this.loading = true;

    // Simular verificación de email (aquí deberías hacer una llamada al backend)
    setTimeout(() => {
      this.loading = false;
      this.emailVerified = true;
      this.emailStep = false;
      this.showSuccessMessage('Email verificado. Ahora puedes cambiar tu contraseña.');
    }, 1000);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    // Limpiar mensajes
    this.hideMessages();

    // Validar formulario
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    const changePasswordData: ChangePasswordData = {
      current_password: this.formData.current_password,
      new_password: this.formData.new_password,
      new_password_confirmation: this.formData.new_password_confirmation
    };

    this.authService.changePassword(changePasswordData).subscribe({
      next: (response) => {
        console.log('Contraseña cambiada exitosamente:', response);
        this.loading = false;
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage('Contraseña actualizada correctamente. Serás redirigido en 3 segundos...');
        
        // Limpiar formulario
        this.resetForm();
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.loading = false;
        
        if (error.message.includes('incorrecta')) {
          this.showErrorMessage('La contraseña actual es incorrecta');
        } else if (error.error?.errors) {
          const backendErrors = error.error.errors;
          let errorMsg = '';
          Object.keys(backendErrors).forEach(key => {
            errorMsg += `${backendErrors[key][0]}\n`;
          });
          this.showErrorMessage(errorMsg);
        } else {
          this.showErrorMessage(error.message || 'Error al cambiar contraseña');
        }
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;

    // Validar contraseña actual
    if (!this.formData.current_password) {
      this.validations.currentPassword = {
        valid: false,
        message: 'Ingrese su contraseña actual'
      };
      isValid = false;
    } else {
      this.validations.currentPassword = { valid: true, message: '' };
    }

    // Validar nueva contraseña
    if (this.formData.new_password.length < 8) {
      this.validations.newPassword = {
        valid: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      };
      isValid = false;
    } else if (!this.isStrongPassword(this.formData.new_password)) {
      this.validations.newPassword = {
        valid: false,
        message: 'La contraseña debe contener letras y números'
      };
      isValid = false;
    } else if (this.formData.new_password === this.formData.current_password) {
      this.validations.newPassword = {
        valid: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      };
      isValid = false;
    } else {
      this.validations.newPassword = { valid: true, message: '' };
    }

    // Validar confirmación
    if (this.formData.new_password !== this.formData.new_password_confirmation) {
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

  // Validación en tiempo real de nueva contraseña
  onNewPasswordBlur(): void {
    if (this.formData.new_password) {
      const isValid = this.formData.new_password.length >= 8 && 
                     this.isStrongPassword(this.formData.new_password) &&
                     this.formData.new_password !== this.formData.current_password;
      
      let message = '';
      if (this.formData.new_password.length < 8) {
        message = 'Debe tener al menos 8 caracteres';
      } else if (!this.isStrongPassword(this.formData.new_password)) {
        message = 'Debe contener letras y números';
      } else if (this.formData.new_password === this.formData.current_password) {
        message = 'Debe ser diferente a la actual';
      }

      this.validations.newPassword = {
        valid: isValid,
        message: message
      };
    }
  }

  // Validación en tiempo real de confirmación
  onConfirmPasswordBlur(): void {
    if (this.formData.new_password_confirmation) {
      const isValid = this.formData.new_password === this.formData.new_password_confirmation;
      this.validations.confirmPassword = {
        valid: isValid,
        message: isValid ? '' : 'Las contraseñas no coinciden'
      };
    }
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private isStrongPassword(password: string): boolean {
    return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  }

  getPasswordStrength(): string {
    const password = this.formData.new_password;
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
      this.hideMessages();
    }, 5000);
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
  }

  hideMessages(): void {
    this.showError = false;
    this.showSuccess = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForm(): void {
    this.formData = {
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    };
    this.validations = {
      currentPassword: { valid: true, message: '' },
      newPassword: { valid: true, message: '' },
      confirmPassword: { valid: true, message: '' }
    };
  }

  cancelChange(): void {
    if (this.emailVerified && !this.currentUser) {
      // Si verificó email pero no está autenticado, volver al paso de email
      this.emailStep = true;
      this.emailVerified = false;
      this.email = '';
      this.resetForm();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
