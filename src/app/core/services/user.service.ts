import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page: number, limit: number, role?: string, search?: string, facultyIds?: string[]): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (facultyIds && facultyIds.length > 0) {
      facultyIds.forEach(id => {
        params = params.append('facultyIds', id);
      });
    }

    if (role === 'teacher') {
      return this.http.get<PaginatedResponse<User>>(`${environment.apiUrl}/teachers`, { params });
    }
    if (role === 'student') {
      return this.http.get<PaginatedResponse<User>>(`${environment.apiUrl}/students`, { params });
    }

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, data: Partial<User>, role?: string): Observable<{ user: User }> {
    if (role === 'teacher' || role === 'Docente') return this.http.patch<{ user: User }>(`${environment.apiUrl}/teachers/${id}`, data);
    if (role === 'student' || role === 'Estudiante') return this.http.patch<{ user: User }>(`${environment.apiUrl}/students/${id}`, data);
    return this.http.put<{ user: User }>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string, role?: string): Observable<{ message: string }> {
    if (role === 'teacher' || role === 'Docente') return this.http.delete<{ message: string }>(`${environment.apiUrl}/teachers/${id}`);
    if (role === 'student' || role === 'Estudiante') return this.http.delete<{ message: string }>(`${environment.apiUrl}/students/${id}`);
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

  uploadCv(file: File): Observable<{ message: string; user: User }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/me/cv`, fd);
  }

  deleteCv(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/me/cv`);
  }

  uploadCertificate(file: File): Observable<{ message: string; certificates: string[] }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ message: string; certificates: string[] }>(`${this.apiUrl}/me/certificates`, fd);
  }

  deleteCertificate(url: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/me/certificates`, { body: { url } });
  }
}
