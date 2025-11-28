// src/app/services/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportData {
  // Dashboard
  resumen?: {
    total_animales: number;
    total_iatf: number;
    total_predicciones: number;
    tasa_prenez_30_dias: number;
    pendientes_confirmacion: number;
  };
  top_sementales?: any[];
  distribucion_grupos?: any[];
  
  // Tasas de Preñez
  por_grupo?: any;
  registros?: any[];
  
  // Efectividad Protocolo
  por_tratamiento?: any;
  uso_dib?: any;
  
  // Análisis Semental
  sementales?: any[];
  
  // Rendimiento ML
  metricas_promedio?: any;
  por_nivel_confianza?: any;
  
  // Campos generales
  totalAnimales?: number;
  animalesActivos?: number;
  animalesInactivos?: number;
  totalIATF?: number;
  iatfPositivos?: number;
  iatfNegativos?: number;
  iatfPendientes?: number;
  tasaExitoIATF?: number;
  totalPredicciones?: number;
  prediccionesPositivas?: number;
  prediccionesNegativas?: number;
  precisionPromedio?: number;
  distribucionPorRaza?: any[];
  distribucionPorGrupo?: any[];
  tendenciasIATF?: any[];
  tendenciasPredicciones?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  // ==================== LISTADO Y CONSULTA ====================
  
  /**
   * Obtener listado de reportes generados
   */
  getReports(params?: any): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener un reporte específico por ID
   */
  getReport(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Eliminar un reporte
   */
  deleteReport(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  // ==================== DASHBOARD ====================
  
  /**
   * Obtener dashboard con estadísticas generales
   */
  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/dashboard`);
  }

  // ==================== GENERACIÓN DE REPORTES ====================
  
  /**
   * Generar reporte de tasas de preñez
   */
  generarReporteTasasPrenez(data: {
    fecha_inicio: string;
    fecha_fin: string;
    grupo_lote?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/tasas-prenez`, data);
  }

  /**
   * Generar reporte de efectividad de protocolo
   */
  generarReporteEfectividadProtocolo(data: {
    fecha_inicio: string;
    fecha_fin: string;
    tratamiento?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/efectividad-protocolo`, data);
  }

  /**
   * Generar reporte de análisis de semental
   */
  generarReporteSemental(data: {
    semental_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/analisis-semental`, data);
  }

  /**
   * Generar reporte de rendimiento del modelo ML
   */
  generarReporteRendimientoML(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/rendimiento-ml`, {});
  }

  // ==================== EXPORTACIÓN ====================
  
  /**
   * Exportar reporte a PDF
   */
  exportarPDF(reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/export/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Exportar reporte a Excel
   */
  exportarExcel(reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/export/excel`, {
      responseType: 'blob'
    });
  }
}