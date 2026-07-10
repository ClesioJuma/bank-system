import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthResponse } from '../core/models';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand-block">
          <span class="brand-mark">MOZA</span>
        </div>

        <div class="form-area">
          <p class="muted">{{ registering ? 'Crie o seu acesso de cliente' : 'Entre com as suas credenciais' }}</p>

          <form (ngSubmit)="submit()">
            @if (registering) {
              <label for="fullName">Nome completo</label>
              <input id="fullName" name="fullName" [(ngModel)]="fullName" required />

              <label for="nuit">NUIT (9 dígitos)</label>
              <input id="nuit" name="nuit" [(ngModel)]="nuit" required pattern="[0-9]{9}" maxlength="9" />
            }

            <label for="username">Utilizador</label>
            <input id="username" name="username" [(ngModel)]="username" required autocomplete="username" />

            <label for="password">Password</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required
                   autocomplete="current-password" />

            @if (error) {
              <div class="error">{{ error }}</div>
            }

            <button type="submit" [disabled]="loading">
              {{ registering ? 'Registar' : 'Entrar' }}
            </button>
          </form>

          <p class="muted toggle" (click)="registering = !registering; error = ''">
            {{ registering ? 'Já tem conta? Entrar' : 'Não tem conta? Registar-se como cliente' }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      width: min(400px, calc(100vw - 32px));
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
    }
    /* Cabeçalho vermelho com o wordmark, como o logótipo do banco */
    .brand-block {
      background: var(--red);
      color: #fff;
      padding: 34px 28px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .brand-block .brand-mark {
      font-size: 2rem;
    }
    .form-area {
      padding: 24px 28px 28px;
    }
    button {
      width: 100%;
    }
    .toggle {
      cursor: pointer;
      text-align: center;
      margin-top: 18px;
    }
    .toggle:hover {
      text-decoration: underline;
    }
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  fullName = '';
  nuit = '';
  error = '';
  loading = false;
  registering = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (!this.username || !this.password) return;
    if (this.registering && (!this.fullName || !this.nuit)) return;
    this.loading = true;
    this.error = '';

    const call = this.registering
      ? this.auth.register(this.username, this.password, this.fullName, this.nuit)
      : this.auth.login(this.username, this.password);

    call.subscribe({
      next: (res: AuthResponse) =>
        // Cada perfil entra no seu módulo
        this.router.navigate([res.role === 'ADMIN' ? '/admin/contas' : '/inicio']),
      error: (err) => {
        this.loading = false;
        // 401 no login = credenciais erradas; outros erros trazem mensagem da API
        this.error = err.status === 401
          ? 'Utilizador ou password incorrectos'
          : err.error?.message ?? 'Erro ao comunicar com o servidor';
      },
    });
  }
}
