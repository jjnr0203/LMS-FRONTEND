import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicTerm, Modality, Career, Subject } from '../models';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private apiUrl = `${environment.apiUrl}/admin/academic`;

  constructor(private http: HttpClient) {}

  // --- ACADEMIC TERMS ---
  getTerms(): Observable<AcademicTerm[]> {
    return this.http.get<AcademicTerm[]>(`${this.apiUrl}/terms`);
  }

  createTerm(data: Partial<AcademicTerm>): Observable<AcademicTerm> {
    return this.http.post<AcademicTerm>(`${this.apiUrl}/terms`, data);
  }

  updateTerm(id: string, data: Partial<AcademicTerm>): Observable<AcademicTerm> {
    return this.http.put<AcademicTerm>(`${this.apiUrl}/terms/${id}`, data);
  }

  deleteTerm(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/terms/${id}`);
  }

  // --- MODALITIES ---
  getModalities(): Observable<Modality[]> {
    return this.http.get<Modality[]>(`${this.apiUrl}/modalities`);
  }

  createModality(data: Partial<Modality>): Observable<Modality> {
    return this.http.post<Modality>(`${this.apiUrl}/modalities`, data);
  }

  updateModality(id: string, data: Partial<Modality>): Observable<Modality> {
    return this.http.put<Modality>(`${this.apiUrl}/modalities/${id}`, data);
  }

  deleteModality(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/modalities/${id}`);
  }

  // --- CAREERS ---
  getCareers(): Observable<Career[]> {
    return this.http.get<Career[]>(`${this.apiUrl}/careers`);
  }

  createCareer(data: Partial<Career>): Observable<Career> {
    return this.http.post<Career>(`${this.apiUrl}/careers`, data);
  }

  updateCareer(id: string, data: Partial<Career>): Observable<Career> {
    return this.http.put<Career>(`${this.apiUrl}/careers/${id}`, data);
  }

  deleteCareer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/careers/${id}`);
  }

  getCareerSubjects(careerId: string): Observable<{ subjectIds: string[] }> {
    return this.http.get<{ subjectIds: string[] }>(`${this.apiUrl}/careers/${careerId}/subjects`);
  }

  assignCareerSubjects(careerId: string, subjectIds: string[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/careers/${careerId}/subjects`, { subjectIds });
  }

  // --- SUBJECTS ---
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  createSubject(data: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects`, data);
  }

  updateSubject(id: string, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${id}`, data);
  }

  deleteSubject(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/subjects/${id}`);
  }
}
