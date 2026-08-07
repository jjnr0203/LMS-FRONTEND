import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InstitutionConfig {
  id?: string;
  name: string;
  ruc?: string;
  slogan?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/institution`;

  getConfig(): Observable<{ config: InstitutionConfig | null }> {
    return this.http.get<{ config: InstitutionConfig | null }>(this.baseUrl);
  }

  updateConfig(data: Partial<InstitutionConfig>): Observable<{ message: string; config: InstitutionConfig }> {
    return this.http.put<{ message: string; config: InstitutionConfig }>(this.baseUrl, data);
  }

  uploadLogo(file: File): Observable<{ message: string; logoUrl: string; config: InstitutionConfig }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; logoUrl: string; config: InstitutionConfig }>(
      `${this.baseUrl}/logo`,
      formData,
    );
  }
}
