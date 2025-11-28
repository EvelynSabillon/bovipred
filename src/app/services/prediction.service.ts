import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Prediction {
  id: number;
  iatf_record_id: number;
  user_id: number;
  probabilidad_prenez: number;
  prediccion_binaria: boolean;
  nivel_confianza: 'alto' | 'medio' | 'bajo';
  modelo_usado: string;
  version_modelo: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  top_features: any;
  recomendaciones: string | null;
  resultado_real: boolean | null;
  prediccion_correcta: boolean | null;
  fecha_verificacion: string | null;
  created_at: string;
  updated_at: string;
  iatf_record?: {
    id: number;
    animal_id: number;
    animal?: {
      id: number;
      arete: string;
      nombre: string;
      raza: string;
    };
    semental?: {
      id: number;
      nombre: string;
      codigo: string;
    };
    condicion_ovarica_od: string;
    condicion_ovarica_oi: string;
    tono_uterino: number;
    tratamiento_previo: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface PredictionFilters {
  nivel_confianza?: 'alto' | 'medio' | 'bajo';
  validadas?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PredictionStats {
  total_predicciones: number;
  predicciones_validadas: number;
  predicciones_correctas: number;
  tasa_acierto: number;
  promedio_confianza: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = `${environment.apiUrl}/predictions`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de predicciones con filtros y paginación
   */
  getPredictions(filters?: PredictionFilters): Observable<ApiResponse<PaginatedResponse<Prediction>>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.nivel_confianza) {
        params = params.set('nivel_confianza', filters.nivel_confianza);
      }
      if (filters.validadas !== undefined) {
        params = params.set('validadas', filters.validadas.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.per_page) {
        params = params.set('per_page', filters.per_page.toString());
      }
    }

    return this.http.get<ApiResponse<PaginatedResponse<Prediction>>>(this.apiUrl, { params });
  }

  /**
   * Obtener una predicción específica por ID
   */
  getPrediction(id: number): Observable<ApiResponse<Prediction>> {
    return this.http.get<ApiResponse<Prediction>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nueva predicción para un registro IATF
   */
  createPrediction(iatfRecordId: number): Observable<ApiResponse<Prediction>> {
    return this.http.post<ApiResponse<Prediction>>(this.apiUrl, {
      iatf_record_id: iatfRecordId
    });
  }

  /**
   * Actualizar resultado real de una predicción
   */
  updateResultadoReal(
    id: number, 
    data: { 
      resultado_real: boolean; 
      fecha_verificacion?: string 
    }
  ): Observable<ApiResponse<Prediction>> {
    return this.http.put<ApiResponse<Prediction>>(`${this.apiUrl}/${id}/resultado`, data);
  }

  /**
   * Obtener estadísticas generales de predicciones
   */
  getEstadisticas(): Observable<ApiResponse<PredictionStats>> {
    return this.http.get<ApiResponse<PredictionStats>>(`${this.apiUrl}/estadisticas/general`);
  }

  /**
   * Helpers para calcular métricas localmente
   */
  calcularPorcentajeExito(predicciones: Prediction[]): number {
    const validadas = predicciones.filter(p => p.resultado_real !== null);
    if (validadas.length === 0) return 0;
    
    const correctas = validadas.filter(p => p.prediccion_correcta === true);
    return Math.round((correctas.length / validadas.length) * 100);
  }

  calcularPromedioConfianza(predicciones: Prediction[]): number {
    if (predicciones.length === 0) return 0;
    
    const suma = predicciones.reduce((acc, p) => acc + p.probabilidad_prenez, 0);
    return Math.round((suma / predicciones.length) * 100);
  }

  /**
   * Obtener clase CSS para nivel de confianza
   */
  getNivelConfianzaClass(nivel: string): string {
    switch (nivel) {
      case 'alto': return 'confianza-alta';
      case 'medio': return 'confianza-media';
      case 'bajo': return 'confianza-baja';
      default: return '';
    }
  }

  /**
   * Obtener color para probabilidad
   */
  getProbabilidadColor(probabilidad: number): string {
    if (probabilidad >= 0.7) return '#4caf50';
    if (probabilidad >= 0.5) return '#ff9800';
    return '#f44336';
  }

  /**
   * Formatear recomendaciones para display
   */
  formatearRecomendaciones(recomendaciones: string | null): string[] {
    if (!recomendaciones) return [];
    return recomendaciones.split('\n').filter(r => r.trim().length > 0);
  }
}