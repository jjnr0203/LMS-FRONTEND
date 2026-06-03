import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10, role?: string): Observable<PaginatedUsers> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    if (role) {
      params = params.set('role', role);
    }
    
    return this.http.get<PaginatedUsers>(this.apiUrl, { params });
  }

  updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string; roleId?: number }): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
