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

  assignTeacher(data: { 
    teacherId: string; 
    subjectId: string; 
    curriculumId?: string;
    academicTermId?: string;
    modalityId?: string;
    jornadaId?: string;
  }): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiUrl}/asignar-docente`, data);
  }

  bulkAssignTeachers(data: {
    curriculumId?: string;
    academicTermId: string;
    subjects: {
      subjectId: string;
      assignments: {
        teacherId: string;
        modalityIds: string[];
        jornadaIds: string[];
      }[];
    }[];
  }): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiUrl}/ofertar-semestre`, data);
  }

  unassignTeacher(subjectId: string, curriculumId?: string, assignmentId?: string) {
    return this.http.post(`${this.apiUrl}/quitar-docente`, {
      subjectId,
      curriculumId,
      assignmentId,
    });
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

  getSubjectColors(): Observable<{ subjectId: string; color: string }[]> {
    return this.http.get<{ subjectId: string; color: string }[]>(`${this.apiUrl}/subject-colors`);
  }

  saveSubjectColor(subjectId: string, color: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/subject-colors`, { subjectId, color });
  }

  getCareerDetail(id: string): Observable<{ career: any; curriculums: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/carrera/${id}`);
  }

  getTerms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ciclos`);
  }

  getModalities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/modalidades`);
  }

  getJornadas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jornadas`);
  }

  getSchedules(teacherSubjectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios/${teacherSubjectId}`);
  }

  saveSchedules(teacherSubjectId: string, schedules: any[]): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.apiUrl}/horarios`, { teacherSubjectId, schedules });
  }
}
