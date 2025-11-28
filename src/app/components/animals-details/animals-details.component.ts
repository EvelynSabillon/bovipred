import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { GrupoService, Grupo, GrupoEstadisticas } from '../../services/grupo.service';
import { AnimalService, Animal, AnimalEstadisticas } from '../../services/animal.service';
import { SementalService, Semental } from '../../services/semental.service';

@Component({
  selector: 'app-animals-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './animals-details.component.html',
  styleUrl: './animals-details.component.css'
})
export class AnimalsDetailsComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  user: any;
  activeTab: 'grupos' | 'vacas' | 'sementales' = 'grupos';
  
  // Data arrays
  grupos: Grupo[] = [];
  animales: Animal[] = [];
  sementales: Semental[] = [];

  // Loading states
  loadingGrupos: boolean = false;
  loadingAnimales: boolean = false;
  loadingSementales: boolean = false;

  // Pagination
  currentPageGrupos: number = 1;
  totalPagesGrupos: number = 1;
  currentPageAnimales: number = 1;
  totalPagesAnimales: number = 1;
  currentPageSementales: number = 1;
  totalPagesSementales: number = 1;

  // Search filters
  searchGrupos: string = '';
  searchAnimales: string = '';
  searchSementales: string = '';

  // Filter states
  filterEstadoReproductivo: string = '';
  filterGrupoId: number | null = null;

  // Modals
  showGrupoModal: boolean = false;
  showAnimalModal: boolean = false;
  showSementalModal: boolean = false;
  showEstadisticasModal: boolean = false;
  
  // Confirmation & Message Modals
  showDeleteConfirmModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  deleteModalTitle: string = '';
  deleteModalMessage: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  pendingDeleteAction: (() => void) | null = null;
  deletingItem: boolean = false;

  // Selected items
  selectedGrupo: Grupo | null = null;
  selectedAnimal: Animal | null = null;
  selectedSemental: Semental | null = null;
  estadisticasData: any = null;

  // Forms
  grupoForm: Partial<Grupo> = { nombre: '', descripcion: '', activo: true };
  animalForm: Partial<Animal> = { arete: '', activo: true };
  sementalForm: Partial<Semental> = { nombre: '', activo: true };

  constructor(
    private authService: AuthService,
    private grupoService: GrupoService,
    private animalService: AnimalService,
    private sementalService: SementalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== TAB MANAGEMENT ====================
  
  setActiveTab(tab: 'grupos' | 'vacas' | 'sementales'): void {
    this.activeTab = tab;
  }

  // ==================== DATA LOADING ====================

  loadAllData(): void {
    this.loadGrupos();
    this.loadAnimales();
    this.loadSementales();
  }

  loadGrupos(page: number = 1): void {
    this.loadingGrupos = true;
    
    this.grupoService.getGrupos({
      activo: true,
      search: this.searchGrupos || undefined,
      page: page
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingGrupos = false)
    )
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.grupos = response.data.data;
          this.currentPageGrupos = response.data.current_page;
          this.totalPagesGrupos = response.data.last_page;
        }
      },
      error: (error) => {
        console.error('Error loading grupos:', error);
        this.showError('Error al cargar los grupos');
      }
    });
  }

  loadAnimales(page: number = 1): void {
    this.loadingAnimales = true;
    
    const params: any = {
      activo: true,
      search: this.searchAnimales || undefined,
      page: page
    };

    if (this.filterEstadoReproductivo) {
      params.estado_reproductivo = this.filterEstadoReproductivo;
    }

    if (this.filterGrupoId) {
      params.grupo_id = this.filterGrupoId;
    }

    this.animalService.getAnimals(params)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingAnimales = false)
    )
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.animales = response.data.data;
          this.currentPageAnimales = response.data.current_page;
          this.totalPagesAnimales = response.data.last_page;
        }
      },
      error: (error) => {
        console.error('Error loading animales:', error);
        this.showError('Error al cargar los animales');
      }
    });
  }

  loadSementales(page: number = 1): void {
    this.loadingSementales = true;
    
    this.sementalService.getSementales({
      activo: true,
      search: this.searchSementales || undefined,
      page: page
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingSementales = false)
    )
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.sementales = response.data.data;
          this.currentPageSementales = response.data.current_page;
          this.totalPagesSementales = response.data.last_page;
        }
      },
      error: (error) => {
        console.error('Error loading sementales:', error);
        this.showError('Error al cargar los sementales');
      }
    });
  }

  // ==================== SEARCH & FILTERS ====================

  onSearchGrupos(): void {
    this.currentPageGrupos = 1;
    this.loadGrupos();
  }

  onSearchAnimales(): void {
    this.currentPageAnimales = 1;
    this.loadAnimales();
  }

  onSearchSementales(): void {
    this.currentPageSementales = 1;
    this.loadSementales();
  }

  onFilterChange(): void {
    this.currentPageAnimales = 1;
    this.loadAnimales();
  }

  clearFilters(): void {
    this.filterEstadoReproductivo = '';
    this.filterGrupoId = null;
    this.onFilterChange();
  }

  // ==================== PAGINATION ====================

  nextPageGrupos(): void {
    if (this.currentPageGrupos < this.totalPagesGrupos) {
      this.loadGrupos(this.currentPageGrupos + 1);
    }
  }

  prevPageGrupos(): void {
    if (this.currentPageGrupos > 1) {
      this.loadGrupos(this.currentPageGrupos - 1);
    }
  }

  nextPageAnimales(): void {
    if (this.currentPageAnimales < this.totalPagesAnimales) {
      this.loadAnimales(this.currentPageAnimales + 1);
    }
  }

  prevPageAnimales(): void {
    if (this.currentPageAnimales > 1) {
      this.loadAnimales(this.currentPageAnimales - 1);
    }
  }

  nextPageSementales(): void {
    if (this.currentPageSementales < this.totalPagesSementales) {
      this.loadSementales(this.currentPageSementales + 1);
    }
  }

  prevPageSementales(): void {
    if (this.currentPageSementales > 1) {
      this.loadSementales(this.currentPageSementales - 1);
    }
  }

  // ==================== CRUD OPERATIONS - GRUPOS ====================

  openCreateGrupoModal(): void {
    this.selectedGrupo = null;
    this.grupoForm = { nombre: '', descripcion: '', activo: true };
    this.showGrupoModal = true;
  }

  openEditGrupoModal(grupo: Grupo): void {
    this.selectedGrupo = grupo;
    this.grupoForm = { ...grupo };
    this.showGrupoModal = true;
  }

  saveGrupo(): void {
    if (!this.grupoForm.nombre) {
      this.showError('El nombre del grupo es requerido');
      return;
    }

    if (this.selectedGrupo) {
      // Update
      this.grupoService.updateGrupo(this.selectedGrupo.id, this.grupoForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Grupo actualizado exitosamente');
              this.closeGrupoModal();
              this.loadGrupos();
            }
          },
          error: (error) => {
            console.error('Error updating grupo:', error);
            this.showError('Error al actualizar el grupo');
          }
        });
    } else {
      // Create
      this.grupoService.createGrupo(this.grupoForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Grupo creado exitosamente');
              this.closeGrupoModal();
              this.loadGrupos();
            }
          },
          error: (error) => {
            console.error('Error creating grupo:', error);
            this.showError('Error al crear el grupo');
          }
        });
    }
  }

  deleteGrupo(grupo: Grupo): void {
    this.deleteModalTitle = 'Eliminar Grupo';
    this.deleteModalMessage = `¿Está seguro que desea eliminar el grupo "${grupo.nombre}"? Esta acción no se puede deshacer.`;
    this.pendingDeleteAction = () => {
      this.deletingItem = true;
      this.grupoService.deleteGrupo(grupo.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.deletingItem = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showDeleteConfirmModal = false;
              this.showSuccess('Grupo eliminado exitosamente');
              this.loadGrupos();
            }
          },
          error: (error) => {
            console.error('Error deleting grupo:', error);
            this.showDeleteConfirmModal = false;
            this.showError(error.error?.message || 'Error al eliminar el grupo');
          }
        });
    };
    this.showDeleteConfirmModal = true;
  }

  viewGrupoEstadisticas(grupo: Grupo): void {
    this.grupoService.getEstadisticas(grupo.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.estadisticasData = response.data;
            this.showEstadisticasModal = true;
          }
        },
        error: (error) => {
          console.error('Error loading estadisticas:', error);
          this.showError('Error al cargar estadísticas');
        }
      });
  }

  closeGrupoModal(): void {
    this.showGrupoModal = false;
    this.selectedGrupo = null;
    this.grupoForm = { nombre: '', descripcion: '', activo: true };
  }

  // ==================== CRUD OPERATIONS - ANIMALS ====================

  openCreateAnimalModal(): void {
    this.selectedAnimal = null;
    this.animalForm = { arete: '', activo: true };
    this.showAnimalModal = true;
  }

  openEditAnimalModal(animal: Animal): void {
    this.selectedAnimal = animal;
    this.animalForm = { ...animal };
    this.showAnimalModal = true;
  }

  saveAnimal(): void {
    if (!this.animalForm.arete) {
      this.showError('El número de arete es requerido');
      return;
    }

    if (this.selectedAnimal) {
      // Update
      this.animalService.updateAnimal(this.selectedAnimal.id, this.animalForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Animal actualizado exitosamente');
              this.closeAnimalModal();
              this.loadAnimales();
            }
          },
          error: (error) => {
            console.error('Error updating animal:', error);
            this.showError('Error al actualizar el animal');
          }
        });
    } else {
      // Create
      this.animalService.createAnimal(this.animalForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Animal creado exitosamente');
              this.closeAnimalModal();
              this.loadAnimales();
            }
          },
          error: (error) => {
            console.error('Error creating animal:', error);
            this.showError('Error al crear el animal');
          }
        });
    }
  }

  deleteAnimal(animal: Animal): void {
    this.deleteModalTitle = 'Eliminar Animal';
    this.deleteModalMessage = `¿Está seguro que desea eliminar el animal con arete "${animal.arete}"? Esta acción no se puede deshacer.`;
    this.pendingDeleteAction = () => {
      this.deletingItem = true;
      this.animalService.deleteAnimal(animal.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.deletingItem = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showDeleteConfirmModal = false;
              this.showSuccess('Animal eliminado exitosamente');
              this.loadAnimales();
            }
          },
          error: (error) => {
            console.error('Error deleting animal:', error);
            this.showDeleteConfirmModal = false;
            this.showError('Error al eliminar el animal');
          }
        });
    };
    this.showDeleteConfirmModal = true;
  }

  viewAnimalEstadisticas(animal: Animal): void {
    this.animalService.getEstadisticas(animal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.estadisticasData = response.data;
            this.showEstadisticasModal = true;
          }
        },
        error: (error) => {
          console.error('Error loading estadisticas:', error);
          this.showError('Error al cargar estadísticas');
        }
      });
  }

  closeAnimalModal(): void {
    this.showAnimalModal = false;
    this.selectedAnimal = null;
    this.animalForm = { arete: '', activo: true };
  }

  // ==================== CRUD OPERATIONS - SEMENTALES ====================

  openCreateSementalModal(): void {
    this.selectedSemental = null;
    this.sementalForm = { nombre: '', activo: true };
    this.showSementalModal = true;
  }

  openEditSementalModal(semental: Semental): void {
    this.selectedSemental = semental;
    this.sementalForm = { ...semental };
    this.showSementalModal = true;
  }

  saveSemental(): void {
    if (!this.sementalForm.nombre) {
      this.showError('El nombre del semental es requerido');
      return;
    }

    if (this.selectedSemental) {
      // Update
      this.sementalService.updateSemental(this.selectedSemental.id, this.sementalForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Semental actualizado exitosamente');
              this.closeSementalModal();
              this.loadSementales();
            }
          },
          error: (error) => {
            console.error('Error updating semental:', error);
            this.showError('Error al actualizar el semental');
          }
        });
    } else {
      // Create
      this.sementalService.createSemental(this.sementalForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Semental creado exitosamente');
              this.closeSementalModal();
              this.loadSementales();
            }
          },
          error: (error) => {
            console.error('Error creating semental:', error);
            this.showError('Error al crear el semental');
          }
        });
    }
  }

  deleteSemental(semental: Semental): void {
    this.deleteModalTitle = 'Eliminar Semental';
    this.deleteModalMessage = `¿Está seguro que desea eliminar el semental "${semental.nombre}"? Esta acción no se puede deshacer.`;
    this.pendingDeleteAction = () => {
      this.deletingItem = true;
      this.sementalService.deleteSemental(semental.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.deletingItem = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showDeleteConfirmModal = false;
              this.showSuccess('Semental eliminado exitosamente');
              this.loadSementales();
            }
          },
          error: (error) => {
            console.error('Error deleting semental:', error);
            this.showDeleteConfirmModal = false;
            this.showError('Error al eliminar el semental');
          }
        });
    };
    this.showDeleteConfirmModal = true;
  }

  actualizarEstadisticasSemental(semental: Semental): void {
    this.sementalService.actualizarEstadisticas(semental.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Estadísticas actualizadas exitosamente');
            this.loadSementales();
          }
        },
        error: (error) => {
          console.error('Error updating estadisticas:', error);
          this.showError('Error al actualizar estadísticas');
        }
      });
  }

  closeSementalModal(): void {
    this.showSementalModal = false;
    this.selectedSemental = null;
    this.sementalForm = { nombre: '', activo: true };
  }

  // ==================== MODALS ====================

  closeEstadisticasModal(): void {
    this.showEstadisticasModal = false;
    this.estadisticasData = null;
  }

  // ==================== UTILITIES ====================

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isVeterinarian(): boolean {
    return this.authService.isVeterinario();
  }

  canEdit(): boolean {
    return this.isAdmin() || this.isVeterinarian();
  }

  getEstadoReproductivoBadgeClass(estado: string): string {
    switch (estado) {
      case 'activa': return 'status-activa';
      case 'prenada': return 'status-prenada';
      case 'seca': return 'status-seca';
      case 'descarte': return 'status-descarte';
      default: return '';
    }
  }

  formatNumber(value: number | string | undefined | null): string {
    if (value === null || value === undefined) return '0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    // Auto cerrar después de 3 segundos
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteAction = null;
  }

  confirmDelete(): void {
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
    }
  }
}