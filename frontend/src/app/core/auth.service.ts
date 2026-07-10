import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse } from './models';

export const API_URL = 'http://localhost:8080/api';

/**
 * Guarda a sessão do utilizador (token JWT e perfil) no localStorage,
 * para a sessão sobreviver a um refresh da página.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { username, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  register(username: string, password: string, fullName: string, nuit: string) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, { username, password, fullName, nuit })
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get username(): string | null {
    return localStorage.getItem('username');
  }

  get isLoggedIn(): boolean {
    return this.token !== null;
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('role', res.role);
  }
}
