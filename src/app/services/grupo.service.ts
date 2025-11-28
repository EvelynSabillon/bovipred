import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Grupo {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  animals_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GrupoEstadisticas {
  grupo: Grupo;
  estadisticas: {
    total_animales: number;
    animales_activos: number;
    estados_reproductivos: { [key: string]: number };
    total_iatf: number;
    preneces_confirmadas: number;
    tasa_prenez: number;
  };
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
export class GrupoService {

  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los grupos con paginación
   */
  getGrupos(params?: {
    activo?: boolean;
    search?: string;
    page?: number;
  }): Observable<PaginatedResponse<Grupo>> {
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

    return this.http.get<PaginatedResponse<Grupo>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener un grupo específico
   */
  getGrupo(id: number): Observable<ApiResponse<Grupo>> {
    return this.http.get<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo grupo
   */
  createGrupo(grupo: Partial<Grupo>): Observable<ApiResponse<Grupo>> {
    return this.http.post<ApiResponse<Grupo>>(this.apiUrl, grupo);
  }

  /**
   * Actualizar grupo existente
   */
  updateGrupo(id: number, grupo: Partial<Grupo>): Observable<ApiResponse<Grupo>> {
    return this.http.put<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`, grupo);
  }

  /**
   * Eliminar grupo
   */
  deleteGrupo(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener estadísticas del grupo
   */
  getEstadisticas(id: number): Observable<ApiResponse<GrupoEstadisticas>> {
    return this.http.get<ApiResponse<GrupoEstadisticas>>(`${this.apiUrl}/${id}/estadisticas`);
  }
}