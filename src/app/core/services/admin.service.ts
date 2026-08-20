import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  createUser(data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleName: string;
  }): Observable<{ message: string; user: User }> {
    if (data.roleName === 'teacher' || data.roleName === 'Docente') {
      return this.http.post<{ message: string; user: User }>(`${environment.apiUrl}/teachers`, data);
    }
    if (data.roleName === 'student' || data.roleName === 'Estudiante') {
      return this.http.post<{ message: string; user: User }>(`${environment.apiUrl}/students`, data);
    }
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/users`, data);
  }

  downloadBackup(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/backups/download`, {
      responseType: 'blob'
    });
  }
}
