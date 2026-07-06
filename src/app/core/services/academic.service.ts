import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicTerm, Modality, Career, Subject, SemesterColor, Curriculum, Faculty, Permission } from '../models';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private apiUrl = `${environment.apiUrl}/admin/academic`;

  public semesterColors = signal<SemesterColor[]>([]);

  constructor(private http: HttpClient) {
    this.loadSemesterColors();
  }

  // --- SEMESTER COLORS ---
  loadSemesterColors() {
    this.http.get<SemesterColor[]>(`${this.apiUrl}/semester-colors`).subscribe({
      next: (colors) => this.semesterColors.set(colors),
      error: (err) => console.error('Failed to load semester colors', err)
    });
  }

  saveSemesterColor(semester: number, color: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/semester-colors`, { semester, color }).pipe(
      tap(() => this.loadSemesterColors())
    );
  }

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

  bulkCreateSubjects(careerId: string, subjects: any[]): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/subjects/bulk-upload`, { careerId, subjects });
  }

  updateSubject(id: string, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${id}`, data);
  }

  deleteSubject(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/subjects/${id}`);
  }

  deleteAllSubjects(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/subjects/clear-all`);
  }

  // --- CURRICULUMS ---
  getCurriculumsByCareer(careerId: string): Observable<Curriculum[]> {
    return this.http.get<Curriculum[]>(`${this.apiUrl}/careers/${careerId}/curriculums`);
  }

  createCurriculum(careerId: string, data: Partial<Curriculum>): Observable<Curriculum> {
    return this.http.post<Curriculum>(`${this.apiUrl}/careers/${careerId}/curriculums`, data);
  }

  updateCurriculum(id: string, data: Partial<Curriculum>): Observable<Curriculum> {
    return this.http.put<Curriculum>(`${this.apiUrl}/curriculums/${id}`, data);
  }

  deleteCurriculum(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/curriculums/${id}`);
  }

  getCurriculumSubjects(curriculumId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/curriculums/${curriculumId}/subjects`);
  }

  // --- CAREER BREAKDOWN ---
  getCareerBreakdown(careerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/careers/${careerId}/breakdown`);
  }

  // --- FACULTIES ---
  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.apiUrl}/faculties`);
  }

  createFaculty(data: Partial<Faculty>): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.apiUrl}/faculties`, data);
  }

  updateFaculty(id: string, data: Partial<Faculty>): Observable<Faculty> {
    return this.http.put<Faculty>(`${this.apiUrl}/faculties/${id}`, data);
  }

  deleteFaculty(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/faculties/${id}`);
  }

  // --- PERMISSIONS ---
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }

  createPermission(data: Partial<Permission>): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/permissions`, data);
  }

  updatePermission(id: string, data: Partial<Permission>): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/permissions/${id}`, data);
  }

  deletePermission(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/permissions/${id}`);
  }

  getPermissionRoles(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(`${this.apiUrl}/permissions/roles`);
  }

  getPermissionsByRole(roleId: string): Observable<{ permissionIds: string[] }> {
    return this.http.get<{ permissionIds: string[] }>(`${this.apiUrl}/permissions/roles/${roleId}`);
  }

  assignPermissionsToRole(roleId: string, permissionIds: string[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/permissions/roles/${roleId}`, { permissionIds });
  }
}
