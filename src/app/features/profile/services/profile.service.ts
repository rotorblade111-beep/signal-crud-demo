import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProfileResponse {
  id: number;
  email: string;
  dateOfBirth: string;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  country: string | null;
}

export interface UpdatePersonalInformationRequest {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string;
  address: string | null;
  country: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5093/profile';

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.apiUrl);
  }

  updatePersonalInformation(
    request: UpdatePersonalInformationRequest
  ): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.apiUrl}/personal-information`, request);
  }

  updateEmail(email: string): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.apiUrl}/email`, { email });
  }

  changePassword(newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/password`, { newPassword });
  }
}
