import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Semental {
  id: number;
  nombre: string;
  raza?: string;
  codigo_pajilla?: string;
  calidad_seminal?: number;
  concentracion_espermatica?: number;
  morfologia_espermatica?: number;
  proveedor?: string;
  fecha_adquisicion?: string;
  precio_pajilla?: number;
  activo: boolean;
  // Estadísticas calculadas
  total_servicios?: number;
  total_preneces?: number;
  tasa_historica_prenez?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SementalService {

  private apiUrl = `${environment.apiUrl}/sementales`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los sementales con paginación
   */
  getSementales(params?: {
    activo?: boolean;
    search?: string;
    page?: number;
  }): Observable<PaginatedResponse<Semental>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.activo !== undefined) {
        httpParams = httpParams.set('activo', params.activo.toString());
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
    }

    return this.http.get<PaginatedResponse<Semental>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener un semental específico
   */
  getSemental(id: number): Observable<ApiResponse<Semental>> {
    return this.http.get<ApiResponse<Semental>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo semental
   */
  createSemental(semental: Partial<Semental>): Observable<ApiResponse<Semental>> {
    return this.http.post<ApiResponse<Semental>>(this.apiUrl, semental);
  }

  /**
   * Actualizar semental existente
   */
  updateSemental(id: number, semental: Partial<Semental>): Observable<ApiResponse<Semental>> {
    return this.http.put<ApiResponse<Semental>>(`${this.apiUrl}/${id}`, semental);
  }

  /**
   * Eliminar semental
   */
  deleteSemental(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar estadísticas del semental
   */
  actualizarEstadisticas(id: number): Observable<ApiResponse<Semental>> {
    return this.http.post<ApiResponse<Semental>>(`${this.apiUrl}/${id}/actualizar-estadisticas`, {});
  }
}