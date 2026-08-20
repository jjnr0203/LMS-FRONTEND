import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User, AuthState } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private state = signal<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    role: this.decodeRole(localStorage.getItem('accessToken')),
    requiresPasswordChange: this.decodeRequiresPasswordChange(localStorage.getItem('accessToken')),
    isLoggedIn: !!localStorage.getItem('accessToken'),
  });

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly refreshTokenVal = computed(() => this.state().refreshToken);
  readonly role = computed(() => this.state().role);
  readonly requiresPasswordChange = computed(() => this.state().requiresPasswordChange);
  readonly isLoggedIn = computed(() => this.state().isLoggedIn);

  constructor(private http: HttpClient) {}

  login(id: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { id, passwordRaw: password })
      .pipe(
        tap((res) => {
          this.setSession(res);
          this.getProfile().subscribe();
        }),
      );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password });
  }

  refresh(): Observable<{ accessToken: string; refreshToken: string }> {
    const token = this.state().refreshToken;
    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/refresh`, {
        refreshToken: token,
      })
      .pipe(
        tap((res) => {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.state.update((s) => ({
            ...s,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            role: this.decodeRole(res.accessToken),
            requiresPasswordChange: this.decodeRequiresPasswordChange(res.accessToken),
          }));
        }),
      );
  }

  logout(): Observable<any> {
    const token = this.state().refreshToken;
    return this.http
      .post(`${this.apiUrl}/logout`, { refreshToken: token })
      .pipe(tap(() => this.clearSession()));
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap((user) => {
        this.state.update((s) => ({ ...s, user }));
      }),
    );
  }

  setSession(res: { accessToken: string; refreshToken: string; user?: User }) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    this.state.set({
      user: res.user ?? null,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      role: this.decodeRole(res.accessToken),
      requiresPasswordChange: this.decodeRequiresPasswordChange(res.accessToken),
      isLoggedIn: true,
    });
  }

  clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.state.set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      requiresPasswordChange: false,
      isLoggedIn: false,
    });
  }

  private decodeRole(token: string | null): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  private decodeRequiresPasswordChange(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.requiresPasswordChange ?? false;
    } catch {
      return false;
    }
  }
}
