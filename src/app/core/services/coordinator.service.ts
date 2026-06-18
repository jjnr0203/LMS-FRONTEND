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

  assignTeacher(data: { teacherId: string; subjectId: string }): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiUrl}/asignar-docente`, data);
  }

  enrollStudent(studentId: string): Observable<{ message: string; enrollment: Enrollment }> {
    return this.http.post<any>(`${this.apiUrl}/matricular`, { studentId });
  }
}
