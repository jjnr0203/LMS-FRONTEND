import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Assignment, Submission } from '../models';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private apiUrl = `${environment.apiUrl}/teacher`;

  constructor(private http: HttpClient) {}

  enrollStudent(data: {
    studentId: string;
    subjectId: string;
  }): Observable<{ message: string; relation: any }> {
    return this.http.post<any>(`${this.apiUrl}/inscribir`, data);
  }

  createAssignment(data: {
    title: string;
    description: string;
    subjectId: string;
    dueDate: string;
    maxScore: number;
  }): Observable<{ message: string; assignment: Assignment }> {
    return this.http.post<any>(`${this.apiUrl}/tareas`, data);
  }

  gradeSubmission(data: {
    submissionId: string;
    grade: number;
    feedback?: string;
  }): Observable<{ message: string; submission: Submission }> {
    return this.http.post<any>(`${this.apiUrl}/calificar`, data);
  }

  getTeacherStats(teacherId: string): Observable<{ totalHours: number; careers: any[]; subjects: any[] }> {
    return this.http.get<any>(`${environment.apiUrl}/teachers/${teacherId}/stats`);
  }
}
