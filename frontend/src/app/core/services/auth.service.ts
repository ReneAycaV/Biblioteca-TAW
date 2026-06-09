import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ILoginRequestDTO } from '../../shared/dtos/auth/login-request.dto';
import { ILoginResponseDTO } from '../../shared/dtos/auth/login-response.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  // Llama al endpoint POST /auth/login del backend
  login(credenciales: ILoginRequestDTO): Observable<ILoginResponseDTO> {
    return this.http.post<ILoginResponseDTO>(`${this.apiUrl}/login`, credenciales);
  }

  // Guarda el JWT y los datos del usuario recibidos del backend
  guardarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  // Decodifica el payload del JWT para obtener el rol
  getRol(): string {
    const token = this.getToken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.rol;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
