import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page = 1, limit = 10, role?: string): Observable<PaginatedResponse<User>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (role) params = params.set('role', role);
    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/me/password`, data);
  }

  uploadAvatar(file: File): Observable<{ message: string; user: User }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/me/avatar`, fd);
  }
}
