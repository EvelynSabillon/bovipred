import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';

interface DashboardStats {
  total_animales: number;
  total_iatf: number;
  total_predicciones: number;
  tasa_prenez_30_dias: number;
  pendientes_confirmacion: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  
  stats: DashboardStats = {
    total_animales: 0,
    total_iatf: 0,
    tasa_prenez_30_dias: 0,
    pendientes_confirmacion: 0,
    total_predicciones: 0
  };

  user: any;
  loading: boolean = true;
  currentDate: Date = new Date();
  showLogoutModal: boolean = false;
  loggingOut: boolean = false;
  showProfileSidebar: boolean = false;
  showUsersList: boolean = false;
  isEditingProfile: boolean = false;
  profileData: any = {};
  usersList: any[] = [];
  loadingUsers: boolean = false;
  showToggleUserStatusModal: boolean = false;
  selectedUser: any = null;
  togglingUserStatus: boolean = false;

  // Dashboard data
  dashboardData: any = null;
  topSementales: any[] = [];
  distribucionGrupos: any[] = [];

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadStatistics();
  }

  loadUserData(): void {
    this.user = this.authService.getCurrentUser();
    // No redirigir aquí - el authGuard ya maneja la protección de la ruta
    if (!this.user) {
      console.warn('User data not loaded yet');
    }
  }

  loadStatistics(): void {
    this.reportService.getDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          if (response.data.resumen) {
            this.stats = response.data.resumen;
          }
          if (response.data.top_sementales) {
            this.topSementales = response.data.top_sementales;
          }
          if (response.data.distribucion_grupos) {
            this.distribucionGrupos = response.data.distribucion_grupos;
          }
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading statistics:', err);
        this.loading = false;
      }
    });
  }

  getMaxSementalValue(): number {
    if (!this.topSementales || this.topSementales.length === 0) return 1;
    return Math.max(...this.topSementales.map(s => s.total_servicios || 0));
  }

  getMaxGrupoValue(): number {
    if (!this.distribucionGrupos || this.distribucionGrupos.length === 0) return 1;
    return Math.max(...this.distribucionGrupos.map(g => g.total));
  }

  getPercentage(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  newAnimal(): void {
    this.router.navigate(['/animals/new']);
  }

  newIATF(): void {
    this.router.navigate(['/iatf/new']);
  }

  newPrediction(): void {
    this.router.navigate(['/predictions/new']);
  }

  viewReports(): void {
    this.router.navigate(['/reports']);
  }

  logout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.loggingOut = true;
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Sesión cerrada exitosamente', response);
        this.loggingOut = false;
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.loggingOut = false;
        this.showLogoutModal = false;
        // Aunque falle el backend, redirigir al login
        this.router.navigate(['/login']);
      }
    });
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  // Métodos de perfil
  toggleProfileSidebar(): void {
    this.showProfileSidebar = !this.showProfileSidebar;
    if (this.showProfileSidebar) {
      this.showUsersList = false;
      this.loadProfileData();
    }
  }

  loadProfileData(): void {
    this.profileData = { ...this.user };
    this.isEditingProfile = false;
  }

  editProfile(): void {
    this.isEditingProfile = true;
  }

  saveProfile(): void {
    // Aquí se implementaría la llamada al backend
    this.authService.updateProfile(this.profileData).subscribe({
      next: (response) => {
        console.log('Perfil actualizado', response);
        this.user = response.data;
        this.isEditingProfile = false;
      },
      error: (error) => {
        console.error('Error al actualizar perfil', error);
      }
    });
  }

  cancelEditProfile(): void {
    this.loadProfileData();
    this.isEditingProfile = false;
  }

  closeProfileSidebar(): void {
    this.showProfileSidebar = false;
    this.isEditingProfile = false;
  }

  // Métodos de usuarios (solo admin)
  toggleUsersList(): void {
    if (!this.isAdmin()) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    this.showUsersList = !this.showUsersList;
    if (this.showUsersList) {
      this.showProfileSidebar = false;
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.authService.listUsers().subscribe({
      next: (response) => {
        console.log('Usuarios cargados', response);
        this.usersList = response.data?.data || response.data || [];
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this.loadingUsers = false;
      }
    });
  }

  toggleUserStatus(userId: number): void {
    if (!this.isAdmin()) return;
    
    if (confirm('¿Estás seguro de cambiar el estado de este usuario?')) {
      this.authService.toggleUserStatus(userId).subscribe({
        next: (response) => {
          console.log('Estado actualizado', response);
          this.loadUsers(); // Recargar lista
        },
        error: (error) => {
          console.error('Error al cambiar estado', error);
        }
      });
    }
  }

  showToggleUserModal(user: any): void {
    this.selectedUser = user;
    this.showToggleUserStatusModal = true;
  }

  cancelToggleUserStatus(): void {
    this.showToggleUserStatusModal = false;
    this.selectedUser = null;
  }

  confirmToggleUserStatus(): void {
    if (!this.selectedUser) return;

    this.togglingUserStatus = true;
    this.authService.toggleUserStatus(this.selectedUser.id).subscribe({
      next: (response) => {
        console.log('Estado actualizado:', response);
        this.togglingUserStatus = false;
        this.showToggleUserStatusModal = false;
        this.selectedUser = null;
        this.loadUsers(); // Recargar lista
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        alert('Error al cambiar el estado del usuario');
        this.togglingUserStatus = false;
      }
    });
  }

  closeUsersList(): void {
    this.showUsersList = false;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}

