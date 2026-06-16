import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tuition, User } from '../models';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  private apiUrl = `${environment.apiUrl}/tesoreria`;

  constructor(private http: HttpClient) {}

  getTuitions(): Observable<{ tuitions: Tuition[] }> {
    return this.http.get<{ tuitions: Tuition[] }>(`${this.apiUrl}/matriculas`);
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
