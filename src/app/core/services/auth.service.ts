import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(id: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { emailOrCedula: id, password }).pipe(
      tap(response => {
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<any>(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getRoleFromToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return null;
    }
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/me`);
  }
}
