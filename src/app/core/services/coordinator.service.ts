import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Subject, Enrollment } from '../models';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private apiUrl = `${environment.apiUrl}/coordinador`;

  constructor(private http: HttpClient) {}

  registerStudent(data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Observable<{
    message: string;
    user: User;
    tuition: { status: string; paidInstallments: number };
  }> {
    return this.http.post<any>(`${this.apiUrl}/estudiantes`, data);
  }

  registerTeacher(data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Observable<{ message: string; user: User }> {
    return this.http.post<any>(`${this.apiUrl}/docentes`, data);
  }

  createSubject(data: {
    name: string;
    code: string;
    credits: number;
    description?: string;
  }): Observable<{ message: string; subject: Subject }> {
    return this.http.post<any>(`${this.apiUrl}/materias`, data);
  }

  enrollStudent(studentId: string): Observable<{ message: string; enrollment: Enrollment }> {
    return this.http.post<any>(`${this.apiUrl}/matricular`, { studentId });
  }
}
