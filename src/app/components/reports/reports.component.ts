// src/app/pages/reports/reports.component.ts
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ReportService, ReportData } from '../../services/report.service';
import { SementalService } from '../../services/semental.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  user: any;
  
  // Report types
  reportTypes = [
    {
      id: 'tasas_prenez',
      name: 'Tasas de Preñez',
      icon: '💉',
      description: 'Análisis de tasas de éxito',
      color: '#2196f3'
    },
    {
      id: 'efectividad_protocolo',
      name: 'Efectividad Protocolo',
      icon: '🔬',
      description: 'Análisis de protocolos IATF',
      color: '#ff9800'
    },
    {
      id: 'analisis_semental',
      name: 'Análisis Semental',
      icon: '🐂',
      description: 'Rendimiento de sementales',
      color: '#9c27b0'
    },
    {
      id: 'rendimiento_ml',
      name: 'Rendimiento ML',
      icon: '🤖',
      description: 'Precisión del modelo IA',
      color: '#6a11cb'
    }
  ];

  selectedReport: string = 'tasas_prenez';
  
  // Data
  reportData: ReportData | null = null;
  currentReportId: number | null = null;
  sementales: any[] = [];
  savedReports: any[] = [];
  
  // Loading states
  loadingReport: boolean = false;
  loadingSavedReports: boolean = false;
  exportingPDF: boolean = false;
  exportingExcel: boolean = false;
  generatingReport: boolean = false;
  deletingReport: number | null = null;
  
  // Filters
  filters = {
    fecha_inicio: '',
    fecha_fin: '',
    grupo_lote: '',
    tratamiento: '',
    semental_id: null as number | null,
  };

  // Modals
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showConfirmDeleteModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  reportToDelete: number | null = null;

  // View mode
  viewMode: 'create' | 'list' = 'create';

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private sementalService: SementalService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadSementales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== DATA LOADING ====================

  loadSementales(): void {
    this.sementalService.getSementales({ activo: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.sementales = response.data.data;
          }
        },
        error: (error) => console.error('Error loading sementales:', error)
      });
  }

  loadSavedReports(): void {
    this.loadingSavedReports = true;
    
    const params: any = {
      tipo_reporte: this.selectedReport
    };
    
    this.reportService.getReports(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingSavedReports = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.savedReports = response.data.data;
          }
        },
        error: (error) => {
          console.error('Error loading saved reports:', error);
          this.showError('Error al cargar reportes guardados');
        }
      });
  }

  // ==================== REPORT ACTIONS ====================

  selectReport(reportId: string): void {
    this.selectedReport = reportId;
    this.clearFilters();
    this.viewMode = 'create';
    this.reportData = null;
    this.currentReportId = null;
  }

  generateReport(): void {
    if (!this.validateFilters()) {
      this.showError('Por favor complete los campos requeridos');
      return;
    }

    this.generatingReport = true;
    let reportObservable;
    
    switch (this.selectedReport) {
      case 'tasas_prenez':
        reportObservable = this.reportService.generarReporteTasasPrenez({
          fecha_inicio: this.filters.fecha_inicio,
          fecha_fin: this.filters.fecha_fin,
          grupo_lote: this.filters.grupo_lote || undefined
        });
        break;
      
      case 'efectividad_protocolo':
        reportObservable = this.reportService.generarReporteEfectividadProtocolo({
          fecha_inicio: this.filters.fecha_inicio,
          fecha_fin: this.filters.fecha_fin,
          tratamiento: this.filters.tratamiento || undefined
        });
        break;
      
      case 'analisis_semental':
        reportObservable = this.reportService.generarReporteSemental({
          semental_id: this.filters.semental_id || undefined,
          fecha_inicio: this.filters.fecha_inicio || undefined,
          fecha_fin: this.filters.fecha_fin || undefined
        });
        break;
      
      case 'rendimiento_ml':
        reportObservable = this.reportService.generarReporteRendimientoML();
        break;
      
      default:
        this.showError('Tipo de reporte no válido');
        this.generatingReport = false;
        return;
    }
    
    reportObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.generatingReport = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.reportData = response.data.data_resultados;
            this.currentReportId = response.data.id;
            this.showSuccess('Reporte generado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error generating report:', error);
          this.showError('Error al generar el reporte');
        }
      });
  }

  validateFilters(): boolean {
    switch (this.selectedReport) {
      case 'tasas_prenez':
      case 'efectividad_protocolo':
        return !!(this.filters.fecha_inicio && this.filters.fecha_fin);
      
      case 'analisis_semental':
      case 'rendimiento_ml':
        return true; // Filtros opcionales
      
      default:
        return true;
    }
  }

  clearFilters(): void {
    this.filters = {
      fecha_inicio: '',
      fecha_fin: '',
      grupo_lote: '',
      tratamiento: '',
      semental_id: null
    };
  }

  // ==================== SAVED REPORTS ====================

  switchToList(): void {
    this.viewMode = 'list';
    this.loadSavedReports();
  }

  switchToCreate(): void {
    this.viewMode = 'create';
    this.reportData = null;
    this.currentReportId = null;
  }

  viewSavedReport(report: any): void {
    this.reportData = report.data_resultados;
    this.currentReportId = report.id;
    this.selectedReport = report.tipo_reporte;
    this.viewMode = 'create';
  }

  confirmDeleteReport(reportId: number): void {
    this.reportToDelete = reportId;
    this.showConfirmDeleteModal = true;
  }

  deleteReport(): void {
    if (!this.reportToDelete) return;
    
    this.deletingReport = this.reportToDelete;
    
    this.reportService.deleteReport(this.reportToDelete)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deletingReport = null)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Reporte eliminado exitosamente');
            this.loadSavedReports();
            this.showConfirmDeleteModal = false;
            this.reportToDelete = null;
          }
        },
        error: (error) => {
          console.error('Error deleting report:', error);
          this.showError('Error al eliminar el reporte');
        }
      });
  }

  cancelDelete(): void {
    this.showConfirmDeleteModal = false;
    this.reportToDelete = null;
  }

  // ==================== EXPORT ====================

  exportToPDF(): void {
    if (!this.currentReportId) {
      this.showError('No hay reporte para exportar');
      return;
    }

    this.exportingPDF = true;
    
    this.reportService.exportarPDF(this.currentReportId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.exportingPDF = false)
      )
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `reporte_${this.selectedReport}_${Date.now()}.pdf`);
          this.showSuccess('Reporte PDF descargado exitosamente');
        },
        error: (error) => {
          console.error('Error exporting PDF:', error);
          this.showError('Error al exportar el reporte a PDF');
        }
      });
  }

  exportToExcel(): void {
    if (!this.currentReportId) {
      this.showError('No hay reporte para exportar');
      return;
    }

    this.exportingExcel = true;
    
    this.reportService.exportarExcel(this.currentReportId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.exportingExcel = false)
      )
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `reporte_${this.selectedReport}_${Date.now()}.xlsx`);
          this.showSuccess('Reporte Excel descargado exitosamente');
        },
        error: (error) => {
          console.error('Error exporting Excel:', error);
          this.showError('Error al exportar el reporte a Excel');
        }
      });
  }

  downloadFile(blob: Blob, filename: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  // ==================== UTILITIES ====================

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getReportColor(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report?.color || '#4a7c29';
  }

  getReportName(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report?.name || reportId;
  }

  getReportIcon(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report?.icon || '📊';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
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

  // ==================== REPORT DATA HELPERS ====================

  getTasaPrenezData(): any {
    if (!this.reportData || this.selectedReport !== 'tasas_prenez') return null;
    return this.reportData.resumen || this.reportData;
  }

  getEfectividadData(): any {
    if (!this.reportData || this.selectedReport !== 'efectividad_protocolo') return null;
    return this.reportData;
  }

  getSementalData(): any {
    if (!this.reportData || this.selectedReport !== 'analisis_semental') return null;
    return this.reportData.sementales || [];
  }

  getMLData(): any {
    if (!this.reportData || this.selectedReport !== 'rendimiento_ml') return null;
    return this.reportData.resumen || this.reportData;
  }
}