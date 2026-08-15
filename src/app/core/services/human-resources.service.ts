import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HumanResourcesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/human-resources`;

  getDashboardStats(): Observable<{ stats: any }> {
    return this.http.get<{ stats: any }>(`${this.apiUrl}/dashboard/stats`);
  }

  getStaff(params: { page: number; limit: number; role?: string; search?: string }): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());
    
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/staff`, { params: httpParams });
  }

  createStaff(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/staff`, data);
  }

  createTeacher(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/teachers`, payload);
  }

  uploadUserCv(userId: string, file: File): Observable<{ message: string, cvUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string, cvUrl: string }>(`${this.apiUrl}/users/${userId}/cv`, formData);
  }

  deleteUserCv(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${userId}/cv`);
  }

  uploadUserCertificate(userId: string, file: File): Observable<{ message: string, certificateUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string, certificateUrl: string }>(`${this.apiUrl}/users/${userId}/certificates`, formData);
  }

  deleteUserCertificate(userId: string, url: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${userId}/certificates`, { body: { url } });
  }
}
