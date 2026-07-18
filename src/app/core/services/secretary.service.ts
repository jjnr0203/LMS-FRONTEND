import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inscription, EnrollmentDetail, AcademicHistory, Certificate } from '../models';

@Injectable({ providedIn: 'root' })
export class SecretaryService {
  private apiUrl = `${environment.apiUrl}/secretary`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<{ totalInscriptions: number; pendingInscriptions: number; totalCertificates: number }> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  createInscription(data: {
    studentId: string;
    careerId: string;
    documentUrl?: string;
    notes?: string;
  }): Observable<{ message: string; inscription: Inscription }> {
    return this.http.post<any>(`${this.apiUrl}/inscripciones`, data);
  }

  listInscriptions(): Observable<{ inscriptions: Inscription[] }> {
    return this.http.get<any>(`${this.apiUrl}/inscripciones`);
  }

  createEnrollment(data: {
    studentId: string;
    academicTermId: string;
    careerId: string;
    level: number;
    subjectIds?: string[];
  }): Observable<{ message: string; enrollment: EnrollmentDetail }> {
    return this.http.post<any>(`${this.apiUrl}/matricula`, data);
  }

  getAcademicHistory(studentId: string): Observable<AcademicHistory> {
    return this.http.get<AcademicHistory>(`${this.apiUrl}/historial/${studentId}`);
  }

  generateCertificate(data: {
    studentId: string;
    type: string;
  }): Observable<{ message: string; certificate: Certificate }> {
    return this.http.post<any>(`${this.apiUrl}/certificados`, data);
  }

  listCertificates(studentId: string): Observable<{ certificates: Certificate[] }> {
    return this.http.get<any>(`${this.apiUrl}/certificados/${studentId}`);
  }

  getCareers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/careers`);
  }

  getTerms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/terms`);
  }

  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/subjects`);
  }

  getSubjectsByCareer(careerId: string, semester?: number): Observable<any[]> {
    let url = `${this.apiUrl}/subjects-by-career?careerId=${careerId}`;
    if (semester) url += `&semester=${semester}`;
    return this.http.get<any[]>(url);
  }

  getSemestersByCareer(careerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/semesters-by-career?careerId=${careerId}`);
  }
}
