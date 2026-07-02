import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Subject, Enrollment } from '../models';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private apiUrl = `${environment.apiUrl}/coordinator`;

  constructor(private http: HttpClient) {}

  getSubjects(): Observable<{ subjects: Subject[] }> {
    return this.http.get<{ subjects: Subject[] }>(`${this.apiUrl}/materias`);
  }

  createSubject(data: {
    name: string;
    code: string;
    credits: number;
    description?: string;
  }): Observable<{ message: string; subject: Subject }> {
    return this.http.post<any>(`${this.apiUrl}/materias`, data);
  }

  assignTeacher(data: { teacherId: string; subjectId: string; curriculumId?: string }): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiUrl}/asignar-docente`, data);
  }

  unassignTeacher(subjectId: string, curriculumId?: string): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiUrl}/quitar-docente`, { subjectId, curriculumId });
  }

  enrollStudent(studentId: string): Observable<{ message: string; enrollment: Enrollment }> {
    return this.http.post<any>(`${this.apiUrl}/matricular`, { studentId });
  }

  registerTeacher(data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDate?: string;
    phone?: string;
  }): Observable<{ message: string; user: any }> {
    return this.http.post<any>(`${this.apiUrl}/register-teacher`, data);
  }

  getDashboard(): Observable<{ careers: any[]; totalSubjects: number }> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  getCareerDetail(id: string): Observable<{ career: any; curriculums: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/carrera/${id}`);
  }
}
