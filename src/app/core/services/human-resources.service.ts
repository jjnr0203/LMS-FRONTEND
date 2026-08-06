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
}
