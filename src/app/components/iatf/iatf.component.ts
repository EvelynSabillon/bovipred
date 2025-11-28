import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { IatfService, IATFRecord, IATFFilters } from '../../services/iatf.service';
import { AnimalService } from '../../services/animal.service';
import { SementalService } from '../../services/semental.service';

@Component({
  selector: 'app-iatf',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './iatf.component.html',
  styleUrl: './iatf.component.css'
})
export class IatfComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  user: any;
  
  // Data arrays
  iatfList: IATFRecord[] = [];
  animales: any[] = [];
  sementales: any[] = [];

  // Loading states
  loadingIATF: boolean = false;
  loadingAnimales: boolean = false;
  loadingSementales: boolean = false;
  savingRecord: boolean = false;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  perPage: number = 15;

  // Search and filters
  searchText: string = '';
  filterResultado: string = '';
  filterAnimalId: number | null = null;
  filterSementalId: number | null = null;
  filterFechaInicio: string = '';
  filterFechaFin: string = '';

  // Modals
  showIATFModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showResultadoModal: boolean = false;
  showDetailsModal: boolean = false;

  // Current step for multi-step form
  currentStep: number = 1;
  totalSteps: number = 5;

  // Selected items
  selectedIATF: IATFRecord | null = null;
  
  // Messages
  deleteModalTitle: string = '';
  deleteModalMessage: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  pendingDeleteAction: (() => void) | null = null;
  deletingItem: boolean = false;

  // Main IATF Form
  iatfForm: Partial<IATFRecord> = this.getEmptyForm();

  // Resultado Form
  resultadoForm = {
    resultado_iatf: 'pendiente' as 'confirmada' | 'no_prenada' | 'muerte_embrionaria' | 'pendiente',
    fecha_confirmacion: '',
    dias_gestacion_confirmada: 45
  };

  constructor(
    private authService: AuthService,
    private iatfService: IatfService,
    private animalService: AnimalService,
    private sementalService: SementalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadIATF();
    this.loadAnimales();
    this.loadSementales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== FORM INITIALIZATION ====================

  getEmptyForm(): Partial<IATFRecord> {
    return {
      animal_id: 0,
      semental_id: null,
      
      // Fechas
      fecha_iatf: '',
      fecha_protocolo_dia_0: null,
      fecha_protocolo_dia_8: null,
      fecha_protocolo_dia_9: null,
      fecha_protocolo_dia_10: null,
      
      // Variables Reproductivas
      condicion_ovarica_od: null,
      condicion_ovarica_oi: null,
      tono_uterino: null,
      tratamiento_previo: null,
      
      // Variables de Manejo
      dias_tonificacion: null,
      sal_mineral_gr: 110, // Valor estándar según documentación
      modivitasan_ml: null,
      fosfoton_ml: null,
      seve_ml: null,
      desparasitacion_previa: false,
      vitaminas_aplicadas: false,
      
      // Protocolo IATF
      dispositivo_dib: false,
      estradiol_ml: null,
      retirada_dib: false,
      ecg_ml: null,
      pf2_alpha_ml: null,
      hora_iatf: null,
      
      // Variables Ambientales
      epoca_anio: null,
      temperatura_ambiente: null,
      humedad_relativa: null,
      
      // Variables de Estrés
      estres_manejo: null,
      calidad_pasturas: null,
      disponibilidad_agua: null,
      
      // Históricos
      gestacion_previa: false,
      dias_gestacion_previa: null,
      
      // Resultado (inicialmente pendiente)
      resultado_iatf: 'pendiente',
      prenez_confirmada: null,
      fecha_confirmacion: null,
      dias_gestacion_confirmada: null,
      
      // Observaciones
      observaciones: null,
      tecnico_responsable: null
    };
  }

  // ==================== DATA LOADING ====================

  loadIATF(page: number = 1): void {
    this.loadingIATF = true;
    
    const filters: IATFFilters = {
      page: page,
      per_page: this.perPage
    };

    if (this.filterResultado) {
      filters.resultado_iatf = this.filterResultado;
    }
    if (this.filterAnimalId) {
      filters.animal_id = this.filterAnimalId;
    }
    if (this.filterSementalId) {
      filters.semental_id = this.filterSementalId;
    }
    if (this.filterFechaInicio) {
      filters.fecha_inicio = this.filterFechaInicio;
    }
    if (this.filterFechaFin) {
      filters.fecha_fin = this.filterFechaFin;
    }

    this.iatfService.getIatfRecords(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingIATF = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.iatfList = response.data.data;
            this.currentPage = response.data.current_page;
            this.totalPages = response.data.last_page;
          }
        },
        error: (error) => {
          console.error('Error loading IATF records:', error);
          this.showError('Error al cargar los registros de IATF');
        }
      });
  }

  loadAnimales(): void {
    this.loadingAnimales = true;
    this.animalService.getAnimals({ activo: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingAnimales = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.animales = response.data.data || response.data;
          }
        },
        error: (error) => {
          console.error('Error loading animales:', error);
          this.showError('Error al cargar animales');
        }
      });
  }

  loadSementales(): void {
    this.loadingSementales = true;
    this.sementalService.getSementales({ activo: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingSementales = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.sementales = response.data.data || response.data;
          }
        },
        error: (error) => {
          console.error('Error loading sementales:', error);
          this.showError('Error al cargar sementales');
        }
      });
  }

  // ==================== SEARCH & FILTERS ====================

  onSearch(): void {
    this.currentPage = 1;
    this.loadIATF();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadIATF();
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterResultado = '';
    this.filterAnimalId = null;
    this.filterSementalId = null;
    this.filterFechaInicio = '';
    this.filterFechaFin = '';
    this.loadIATF();
  }

  // ==================== PAGINATION ====================

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadIATF(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadIATF(this.currentPage - 1);
    }
  }

  // ==================== MULTI-STEP FORM NAVIGATION ====================

  nextStep(): void {
    if (this.validateCurrentStep() && this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: // Datos Básicos
        if (!this.iatfForm.animal_id || this.iatfForm.animal_id === 0) {
          this.showError('Debe seleccionar un animal');
          return false;
        }
        if (!this.iatfForm.fecha_iatf) {
          this.showError('Debe ingresar la fecha de IATF');
          return false;
        }
        return true;
        
      case 2: // Variables Reproductivas
        // Validaciones opcionales, pero útiles
        if (this.iatfForm.tono_uterino && (this.iatfForm.tono_uterino < 0 || this.iatfForm.tono_uterino > 100)) {
          this.showError('El tono uterino debe estar entre 0 y 100');
          return false;
        }
        return true;
        
      case 3: // Protocolo IATF
        // Validaciones del protocolo
        return true;
        
      case 4: // Variables Ambientales
        if (this.iatfForm.temperatura_ambiente && this.iatfForm.temperatura_ambiente < -10) {
          this.showError('La temperatura parece incorrecta');
          return false;
        }
        return true;
        
      case 5: // Observaciones
        return true;
        
      default:
        return true;
    }
  }

  // ==================== CRUD OPERATIONS ====================

  openCreateModal(): void {
    this.selectedIATF = null;
    this.iatfForm = this.getEmptyForm();
    this.currentStep = 1;
    this.showIATFModal = true;
  }

  openEditModal(iatf: IATFRecord): void {
    this.selectedIATF = iatf;
    this.iatfForm = { ...iatf };
    this.currentStep = 1;
    this.showIATFModal = true;
  }

  saveIATF(): void {
    if (!this.validateCurrentStep()) {
      return;
    }

    // Validación final
    if (!this.iatfForm.animal_id || this.iatfForm.animal_id === 0) {
      this.showError('Debe seleccionar un animal');
      return;
    }

    if (!this.iatfForm.fecha_iatf) {
      this.showError('Debe ingresar la fecha de IATF');
      return;
    }

    this.savingRecord = true;

    const operation = this.selectedIATF
      ? this.iatfService.updateIatfRecord(this.selectedIATF.id, this.iatfForm)
      : this.iatfService.createIatfRecord(this.iatfForm);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.savingRecord = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showIATFModal = false;
            this.showSuccess(
              this.selectedIATF 
                ? 'Registro de IATF actualizado exitosamente' 
                : 'Registro de IATF creado exitosamente'
            );
            this.loadIATF();
          }
        },
        error: (error) => {
          console.error('Error saving IATF:', error);
          this.showError(
            error.error?.message || 'Error al guardar el registro de IATF'
          );
        }
      });
  }

  deleteIATF(iatf: IATFRecord): void {
    this.deleteModalTitle = 'Eliminar Registro IATF';
    this.deleteModalMessage = `¿Está seguro que desea eliminar el registro de IATF del animal ${iatf.animal?.arete || 'desconocido'} del ${this.formatDate(iatf.fecha_iatf)}? Esta acción no se puede deshacer.`;
    
    this.pendingDeleteAction = () => {
      this.deletingItem = true;
      this.iatfService.deleteIatfRecord(iatf.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.deletingItem = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showDeleteConfirmModal = false;
              this.showSuccess('Registro de IATF eliminado exitosamente');
              this.loadIATF();
            }
          },
          error: (error) => {
            console.error('Error deleting IATF:', error);
            this.showDeleteConfirmModal = false;
            this.showError('Error al eliminar el registro');
          }
        });
    };
    
    this.showDeleteConfirmModal = true;
  }

  // ==================== CONFIRMAR RESULTADO ====================

  openResultadoModal(iatf: IATFRecord): void {
    this.selectedIATF = iatf;
    this.resultadoForm = {
      resultado_iatf: iatf.resultado_iatf === 'pendiente' ? 'pendiente' : (iatf.resultado_iatf || 'pendiente') as any,
      fecha_confirmacion: iatf.fecha_confirmacion || new Date().toISOString().split('T')[0],
      dias_gestacion_confirmada: iatf.dias_gestacion_confirmada || 45
    };
    this.showResultadoModal = true;
  }

  saveResultado(): void {
    if (!this.selectedIATF) {
      this.showError('No hay registro seleccionado');
      return;
    }

    if (this.resultadoForm.resultado_iatf === 'pendiente') {
      this.showError('Debe seleccionar un resultado válido');
      return;
    }

    if (!this.resultadoForm.fecha_confirmacion) {
      this.showError('Debe ingresar la fecha de confirmación');
      return;
    }

    this.savingRecord = true;

    this.iatfService.confirmarResultado(this.selectedIATF.id, {
      resultado_iatf: this.resultadoForm.resultado_iatf,
      fecha_confirmacion: this.resultadoForm.fecha_confirmacion,
      dias_gestacion_confirmada: this.resultadoForm.dias_gestacion_confirmada
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.savingRecord = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showResultadoModal = false;
            this.showSuccess('Resultado confirmado exitosamente');
            this.loadIATF();
          }
        },
        error: (error) => {
          console.error('Error confirming resultado:', error);
          this.showError(error.error?.message || 'Error al confirmar el resultado');
        }
      });
  }

  closeIATFModal(): void {
    this.showIATFModal = false;
    this.selectedIATF = null;
    this.currentStep = 1;
  }

  closeResultadoModal(): void {
    this.showResultadoModal = false;
    this.selectedIATF = null;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedIATF = null;
  }

  // ==================== MODALS ====================

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

  getResultadoBadgeClass(resultado: string | null | undefined): string {
    switch (resultado) {
      case 'confirmada': return 'resultado-positivo';
      case 'no_prenada': return 'resultado-negativo';
      case 'muerte_embrionaria': return 'resultado-me';
      case 'pendiente': return 'resultado-pendiente';
      default: return 'resultado-pendiente';
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  // ==================== ADDITIONAL HELPERS ====================

  getAnimalLabel(animalId: number | undefined): string {
    if (!animalId) return 'No seleccionado';
    const animal = this.animales.find(a => a.id === animalId);
    return animal ? `${animal.arete} - ${animal.nombre}` : 'No encontrado';
  }

  getSementalLabel(sementalId: number | null | undefined): string {
    if (!sementalId) return 'Sin asignar';
    const semental = this.sementales.find(s => s.id === sementalId);
    return semental ? `${semental.nombre} (${semental.raza})` : 'No encontrado';
  }

  getResultadoLabel(resultado: string | null | undefined): string {
    switch (resultado) {
      case 'confirmada': return 'Confirmada';
      case 'no_prenada': return 'No Preñada';
      case 'muerte_embrionaria': return 'Muerte Embrionaria';
      case 'pendiente': return 'Pendiente';
      default: return 'Pendiente';
    }
  }

  getCondicionOvaricaLabel(condicion: string | null | undefined): string {
    switch (condicion) {
      case 'C': return 'Ciclando';
      case 'CL': return 'Cuerpo Lúteo';
      case 'FD': return 'Folículo Dominante';
      case 'F': return 'Folículo';
      case 'I': return 'Inactivo';
      case 'A': return 'Anestro';
      default: return 'No evaluado';
    }
  }

  getTratamientoLabel(tratamiento: string | null | undefined): string {
    switch (tratamiento) {
      case 'T1': return 'T1 - Tonificación Básica';
      case 'T2': return 'T2 - Tonificación Avanzada + Buseralina';
      case 'RS': return 'RS - Resincronización';
      case 'DESCARTE': return 'Descarte';
      default: return 'Ninguno';
    }
  }

  getEpocaLabel(epoca: string | null | undefined): string {
    switch (epoca) {
      case 'verano': return 'Verano (Dic-Mar)';
      case 'invierno': return 'Invierno (Jun-Sep)';
      case 'lluvias': return 'Lluvias (May-Nov)';
      default: return 'No especificado';
    }
  }

  getDisponibilidadAguaLabel(agua: string | null | undefined): string {
    switch (agua) {
      case 'adecuada': return 'Adecuada';
      case 'limitada': return 'Limitada';
      default: return 'No evaluado';
    }
  }

  formatBoolean(value: boolean | null | undefined): string {
    return value ? 'Sí' : 'No';
  }

  formatNumber(value: number | null | undefined, suffix: string = ''): string {
    if (value === null || value === undefined) return '-';
    return `${value}${suffix}`;
  }

  viewDetails(iatf: IATFRecord): void {
    this.selectedIATF = iatf;
    this.showDetailsModal = true;
  }
}