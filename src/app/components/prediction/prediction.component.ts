import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PredictionService, Prediction, PredictionStats } from '../../services/prediction.service';
import { IatfService } from '../../services/iatf.service';

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.css'
})
export class PredictionComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  user: any;
  
  // Data arrays
  predictions: Prediction[] = [];
  iatfRecords: any[] = [];
  stats: PredictionStats | null = null;

  // Loading states
  loadingPredictions: boolean = false;
  loadingIatfRecords: boolean = false;
  loadingStats: boolean = false;
  realizandoPrediccion: boolean = false;
  actualizandoResultado: boolean = false;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalRecords: number = 0;

  // Search and filters
  searchText: string = '';
  filterNivelConfianza: string = '';
  filterValidadas: string = '';

  // Modals
  showPredictionModal: boolean = false;
  showResultadoModal: boolean = false;
  showDetalleModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;

  // Selected items
  selectedPrediction: Prediction | null = null;
  
  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  // Forms
  predictionForm = {
    iatf_record_id: 0
  };

  resultadoForm = {
    resultado_real: true,
    fecha_verificacion: ''
  };

  constructor(
    private authService: AuthService,
    private predictionService: PredictionService,
    private iatfRecordService: IatfService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadPredictions();
    this.loadIatfRecords();
    this.loadEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== DATA LOADING ====================

  loadPredictions(page: number = 1): void {
    this.loadingPredictions = true;
    
    const filters: any = {
      page: page,
      per_page: 15
    };

    if (this.filterNivelConfianza) {
      filters.nivel_confianza = this.filterNivelConfianza;
    }

    if (this.filterValidadas !== '') {
      filters.validadas = this.filterValidadas === 'true';
    }

    this.predictionService.getPredictions(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingPredictions = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.predictions = response.data.data;
            this.currentPage = response.data.current_page;
            this.totalPages = response.data.last_page;
            this.totalRecords = response.data.total;
          }
        },
        error: (error) => {
          console.error('Error loading predictions:', error);
          this.showError('Error al cargar las predicciones');
        }
      });
  }

  loadIatfRecords(): void {
    this.loadingIatfRecords = true;
    
    // Cargar registros IATF que NO tienen predicción aún
    this.iatfRecordService.getIatfRecords({ sin_prediccion: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingIatfRecords = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.iatfRecords = response.data.data || response.data;
          }
        },
        error: (error) => {
          console.error('Error loading IATF records:', error);
        }
      });
  }

  loadEstadisticas(): void {
    this.loadingStats = true;
    
    this.predictionService.getEstadisticas()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStats = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  // ==================== SEARCH & FILTERS ====================

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPredictions();
  }

  clearFilters(): void {
    this.filterNivelConfianza = '';
    this.filterValidadas = '';
    this.loadPredictions();
  }

  // ==================== PAGINATION ====================

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPredictions(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPredictions(this.currentPage - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadPredictions(page);
    }
  }

  // ==================== PREDICTION OPERATIONS ====================

  openPredictionModal(): void {
    if (this.iatfRecords.length === 0) {
      this.showError('No hay registros IATF disponibles para predicción. Primero debe crear un registro IATF.');
      return;
    }
    
    this.predictionForm = {
      iatf_record_id: 0
    };
    this.showPredictionModal = true;
  }

  realizarPrediccion(): void {
    if (!this.predictionForm.iatf_record_id) {
      this.showError('Debe seleccionar un registro IATF');
      return;
    }

    this.realizandoPrediccion = true;
    
    this.predictionService.createPrediction(this.predictionForm.iatf_record_id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.realizandoPrediccion = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showPredictionModal = false;
            this.showSuccess('Predicción realizada exitosamente');
            this.loadPredictions();
            this.loadIatfRecords(); // Recargar para actualizar lista sin predicción
            this.loadEstadisticas(); // Actualizar estadísticas
          }
        },
        error: (error) => {
          console.error('Error realizando predicción:', error);
          const errorMsg = error.error?.message || 'Error al realizar la predicción';
          this.showError(errorMsg);
        }
      });
  }

  openResultadoModal(prediction: Prediction): void {
    this.selectedPrediction = prediction;
    this.resultadoForm = {
      resultado_real: prediction.resultado_real ?? true,
      fecha_verificacion: prediction.fecha_verificacion || new Date().toISOString().split('T')[0]
    };
    this.showResultadoModal = true;
  }

  saveResultado(): void {
    if (!this.selectedPrediction) return;

    this.actualizandoResultado = true;

    this.predictionService.updateResultadoReal(this.selectedPrediction.id, {
      resultado_real: this.resultadoForm.resultado_real,
      fecha_verificacion: this.resultadoForm.fecha_verificacion
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.actualizandoResultado = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showResultadoModal = false;
            this.showSuccess('Resultado actualizado exitosamente');
            this.loadPredictions();
            this.loadEstadisticas();
          }
        },
        error: (error) => {
          console.error('Error updating resultado:', error);
          this.showError(error.error?.message || 'Error al actualizar el resultado');
        }
      });
  }

  openDetalleModal(prediction: Prediction): void {
    this.selectedPrediction = prediction;
    this.showDetalleModal = true;
  }

  closePredictionModal(): void {
    this.showPredictionModal = false;
  }

  closeResultadoModal(): void {
    this.showResultadoModal = false;
    this.selectedPrediction = null;
  }

  closeDetalleModal(): void {
    this.showDetalleModal = false;
    this.selectedPrediction = null;
  }

  // ==================== MODALS ====================

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
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

  getNivelConfianzaLabel(nivel: string): string {
    switch (nivel) {
      case 'alto': return 'Alto';
      case 'medio': return 'Medio';
      case 'bajo': return 'Bajo';
      default: return nivel;
    }
  }

  getNivelConfianzaBadgeClass(nivel: string): string {
    return this.predictionService.getNivelConfianzaClass(nivel);
  }

  getResultadoBadgeClass(resultado: boolean | null): string {
    if (resultado === null) return 'resultado-pendiente';
    return resultado ? 'resultado-positivo' : 'resultado-negativo';
  }

  getResultadoLabel(resultado: boolean | null): string {
    if (resultado === null) return 'Pendiente';
    return resultado ? 'Positivo - Preñada' : 'Negativo - No Preñada';
  }

  getProbabilityColor(probability: number): string {
    return this.predictionService.getProbabilidadColor(probability);
  }

  formatProbability(probability: number): string {
    return (probability * 100).toFixed(1) + '%';
  }

  formatMetric(value: number | null): string {
    if (value === null || value === undefined) return '-';
    return (value * 100).toFixed(1) + '%';
  }

  getRecomendaciones(prediction: Prediction): string[] {
    return this.predictionService.formatearRecomendaciones(prediction.recomendaciones);
  }

  getTopFeatures(prediction: Prediction): any[] {
    if (!prediction.top_features) return [];
    if (Array.isArray(prediction.top_features)) return prediction.top_features;
    try {
      return JSON.parse(prediction.top_features);
    } catch {
      return [];
    }
  }

  formatFeatureName(name: string): string {
    // Convertir nombres de variables a español
    const translations: { [key: string]: string } = {
      'condicion_corporal': 'Condición Corporal',
      'dias_posparto': 'Días Posparto',
      'condicion_ovarica': 'Condición Ovárica',
      'tono_uterino': 'Tono Uterino',
      'calidad_seminal': 'Calidad Seminal',
      'edad_meses': 'Edad',
      'numero_partos': 'Número de Partos',
      'tratamiento_previo': 'Tratamiento Previo'
    };
    return translations[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  // ==================== NAVEGACIÓN ====================

  navigateToIatf(): void {
    this.router.navigate(['/iatf-records']);
  }

  navigateToAnimal(animalId: number): void {
    this.router.navigate(['/animals', animalId]);
  }
}