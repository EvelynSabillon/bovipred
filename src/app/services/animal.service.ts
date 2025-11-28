import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Animal {
  id: number;
  arete: string;
  grupo_id?: number;
  grupo_lote?: string;
  edad_meses?: number;
  peso_kg?: number;
  condicion_corporal?: number;
  numero_partos?: number;
  dias_posparto?: number;
  dias_abiertos?: number;
  historial_abortos?: boolean;
  numero_abortos?: number;
  enfermedades_reproductivas?: boolean;
  descripcion_enfermedades?: string;
  estado_reproductivo?: 'activa' | 'prenada' | 'seca' | 'descarte';
  fecha_ultimo_tratamiento?: string;
  observaciones?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  grupo?: {
    id: number;
    nombre: string;
  };
  ultimo_iatf?: any;
}

export interface AnimalEstadisticas {
  animal: Animal;
  estadisticas: {
    total_iatf: number;
    preneces_confirmadas: number;
    muertes_embrionarias: number;
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
export class AnimalService {

  private apiUrl = `${environment.apiUrl}/animals`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los animales con paginación y filtros
   */
  getAnimals(params?: {
    activo?: boolean;
    grupo_id?: number;
    grupo_lote?: string;
    estado_reproductivo?: string;
    search?: string;
    page?: number;
  }): Observable<PaginatedResponse<Animal>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.activo !== undefined) {
        httpParams = httpParams.set('activo', params.activo.toString());
      }
      if (params.grupo_id) {
        httpParams = httpParams.set('grupo_id', params.grupo_id.toString());
      }
      if (params.grupo_lote) {
        httpParams = httpParams.set('grupo_lote', params.grupo_lote);
      }
      if (params.estado_reproductivo) {
        httpParams = httpParams.set('estado_reproductivo', params.estado_reproductivo);
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
    }

    return this.http.get<PaginatedResponse<Animal>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener un animal específico con sus registros IATF
   */
  getAnimal(id: number): Observable<ApiResponse<Animal>> {
    return this.http.get<ApiResponse<Animal>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo animal
   */
  createAnimal(animal: Partial<Animal>): Observable<ApiResponse<Animal>> {
    return this.http.post<ApiResponse<Animal>>(this.apiUrl, animal);
  }

  /**
   * Actualizar animal existente
   */
  updateAnimal(id: number, animal: Partial<Animal>): Observable<ApiResponse<Animal>> {
    return this.http.put<ApiResponse<Animal>>(`${this.apiUrl}/${id}`, animal);
  }

  /**
   * Eliminar animal (soft delete)
   */
  deleteAnimal(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener estadísticas del animal
   */
  getEstadisticas(id: number): Observable<ApiResponse<AnimalEstadisticas>> {
    return this.http.get<ApiResponse<AnimalEstadisticas>>(`${this.apiUrl}/${id}/estadisticas`);
  }
}