import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface IATFRecord {
  id: number;
  animal_id: number;
  semental_id: number | null;
  
  // Fechas del protocolo
  fecha_iatf: string;
  fecha_protocolo_dia_0: string | null;
  fecha_protocolo_dia_8: string | null;
  fecha_protocolo_dia_9: string | null;
  fecha_protocolo_dia_10: string | null;
  
  // Variables Reproductivas
  condicion_ovarica_od: 'C' | 'CL' | 'FD' | 'F' | 'I' | 'A' | null;
  condicion_ovarica_oi: 'C' | 'CL' | 'FD' | 'F' | 'I' | 'A' | null;
  tono_uterino: number | null;
  tratamiento_previo: 'T1' | 'T2' | 'RS' | 'DESCARTE' | null;
  
  // Variables de Manejo
  dias_tonificacion: number | null;
  sal_mineral_gr: number | null;
  modivitasan_ml: number | null;
  fosfoton_ml: number | null;
  seve_ml: number | null;
  desparasitacion_previa: boolean;
  vitaminas_aplicadas: boolean;
  
  // Protocolo IATF
  dispositivo_dib: boolean;
  estradiol_ml: number | null;
  retirada_dib: boolean;
  ecg_ml: number | null;
  pf2_alpha_ml: number | null;
  hora_iatf: string | null;
  
  // Variables Ambientales/Externas
  epoca_anio: 'verano' | 'invierno' | 'lluvias' | null;
  temperatura_ambiente: number | null;
  humedad_relativa: number | null;
  
  // Variables de Estrés y Manejo
  estres_manejo: number | null;
  calidad_pasturas: number | null;
  disponibilidad_agua: 'adecuada' | 'limitada' | null;
  
  // Datos históricos
  gestacion_previa: boolean;
  dias_gestacion_previa: number | null;
  
  // Resultado
  resultado_iatf: 'confirmada' | 'no_prenada' | 'muerte_embrionaria' | 'pendiente' | null;
  prenez_confirmada: boolean | null;
  fecha_confirmacion: string | null;
  dias_gestacion_confirmada: number | null;
  
  // Observaciones
  observaciones: string | null;
  tecnico_responsable: string | null;
  
  // Relaciones
  animal?: any;
  semental?: any;
  prediction?: any;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface IATFFilters {
  animal_id?: number;
  semental_id?: number;
  resultado_iatf?: string;
  prenez_confirmada?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  sin_prediccion?: boolean;
  page?: number;
  per_page?: number;
}

export interface ConfirmarResultadoRequest {
  resultado_iatf: 'confirmada' | 'no_prenada' | 'muerte_embrionaria';
  fecha_confirmacion: string;
  dias_gestacion_confirmada?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class IatfService {
  private apiUrl = `${environment.apiUrl}/iatf-records`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de registros IATF con filtros y paginación
   */
  getIatfRecords(filters?: IATFFilters): Observable<ApiResponse<PaginatedResponse<IATFRecord>>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.animal_id) {
        params = params.set('animal_id', filters.animal_id.toString());
      }
      if (filters.semental_id) {
        params = params.set('semental_id', filters.semental_id.toString());
      }
      if (filters.resultado_iatf) {
        params = params.set('resultado_iatf', filters.resultado_iatf);
      }
      if (filters.prenez_confirmada !== undefined) {
        params = params.set('prenez_confirmada', filters.prenez_confirmada ? '1' : '0');
      }
      if (filters.fecha_inicio) {
        params = params.set('fecha_inicio', filters.fecha_inicio);
      }
      if (filters.fecha_fin) {
        params = params.set('fecha_fin', filters.fecha_fin);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.per_page) {
        params = params.set('per_page', filters.per_page.toString());
      }
    }

    return this.http.get<ApiResponse<PaginatedResponse<IATFRecord>>>(this.apiUrl, { params });
  }

  /**
   * Obtener un registro IATF específico
   */
  getIatfRecord(id: number): Observable<ApiResponse<IATFRecord>> {
    return this.http.get<ApiResponse<IATFRecord>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo registro IATF
   */
  createIatfRecord(data: Partial<IATFRecord>): Observable<ApiResponse<IATFRecord>> {
    return this.http.post<ApiResponse<IATFRecord>>(this.apiUrl, data);
  }

  /**
   * Actualizar registro IATF existente
   */
  updateIatfRecord(id: number, data: Partial<IATFRecord>): Observable<ApiResponse<IATFRecord>> {
    return this.http.put<ApiResponse<IATFRecord>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar registro IATF
   */
  deleteIatfRecord(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Confirmar resultado de IATF (endpoint especial)
   */
  confirmarResultado(id: number, data: ConfirmarResultadoRequest): Observable<ApiResponse<IATFRecord>> {
    return this.http.post<ApiResponse<IATFRecord>>(`${this.apiUrl}/${id}/confirmar-resultado`, data);
  }

  /**
   * Obtener estadísticas de IATF
   */
  getEstadisticas(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/estadisticas`);
  }
}