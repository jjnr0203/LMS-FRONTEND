import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tuition, User } from '../models';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  private apiUrl = `${environment.apiUrl}/treasury`;

  constructor(private http: HttpClient) {}

  getTuitions(): Observable<{ tuitions: Tuition[] }> {
    return this.http.get<{ tuitions: Tuition[] }>(`${this.apiUrl}/matriculas`);
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

  disableAccount(studentId: string): Observable<{
    message: string;
    user: Partial<User>;
    tuition: Partial<Tuition>;
  }> {
    return this.http.post<any>(`${this.apiUrl}/deshabilitar`, { studentId });
  }
}
