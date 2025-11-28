import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

interface DashboardStats {
  totalAnimals: number;
  totalIATF: number;
  successRate: number;
  pendingConfirmations: number;
  recentPredictions: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor() { }

  getDashboardStats(): Observable<DashboardStats> {
    // Implementación temporal con datos de ejemplo - reemplazar con tu lógica real
    return of({
      totalAnimals: 150,
      totalIATF: 85,
      successRate: 68.5,
      pendingConfirmations: 12,
      recentPredictions: 24
    });
  }
}
