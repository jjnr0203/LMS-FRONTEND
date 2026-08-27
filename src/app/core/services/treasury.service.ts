import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tuition, User } from '../models';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  private apiUrl = `${environment.apiUrl}/treasury`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<{ stats: TreasuryDashboardStats; recentTuitions: Tuition[] }> {
    return this.http.get<{ stats: TreasuryDashboardStats; recentTuitions: Tuition[] }>(
      `${this.apiUrl}/dashboard`,
    );
  }

  getMatriculas(): Observable<{ data: MatriculaRow[] }> {
    return this.http.get<{ data: MatriculaRow[] }>(`${this.apiUrl}/matriculas`);
  }

  registerStudent(data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDate?: string;
    phone?: string;
  }): Observable<{
    message: string;
    user: User;
    tuition: { status: string; paidInstallments: number };
  }> {
    return this.http.post<any>(`${this.apiUrl}/estudiantes`, data);
  }

  registerPayment(studentId: string): Observable<{
    message: string;
    tuition: Tuition;
  }> {
    return this.http.post<any>(`${this.apiUrl}/abonos`, { studentId });
  }

  completePayment(studentId: string): Observable<{
    message: string;
    tuition: Tuition;
  }> {
    return this.http.post<any>(`${this.apiUrl}/matriculas/${studentId}/pago-completo`, {});
  }

  createConvenio(studentId: string): Observable<{
    message: string;
    tuition: Tuition;
  }> {
    return this.http.post<any>(`${this.apiUrl}/matriculas/${studentId}/convenio`, {});
  }

  enrollStudent(studentId: string): Observable<{
    message: string;
    tuition: Tuition;
  }> {
    return this.http.post<any>(`${this.apiUrl}/matricular`, { studentId });
  }

  matricular(studentId: string): Observable<{
    message: string;
    tuition: Tuition;
  }> {
    return this.http.post<any>(`${this.apiUrl}/matriculas/${studentId}/matricular`, {});
  }

  disableAccount(studentId: string): Observable<{
    message: string;
    user: Partial<User>;
    tuition: Partial<Tuition>;
  }> {
    return this.http.post<any>(`${this.apiUrl}/deshabilitar`, { studentId });
  }

  getOverdueStudents(): Observable<{ data: OverdueStudent[] }> {
    return this.http.get<{ data: OverdueStudent[] }>(`${this.apiUrl}/overdue-students`);
  }
}

export interface TreasuryDashboardStats {
  total: number;
  matriculados: number;
  pendientes: number;
  pagoTotal: number;
  cuotasPagadas: number;
}

export interface MatriculaRow {
  studentId: string;
  firstName: string;
  lastName: string;
  enrolled: boolean;
  status: 'pago_total' | 'pendiente' | 'convenio' | 'no_paga';
  paidInstallments: number;
}

export interface OverdueStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  paidInstallments: number;
  expectedInstallments: number;
  overdueMonths: number;
  nextDueDate: string;
}
