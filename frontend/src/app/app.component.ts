import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

/**
 * Estrutura da aplicação. A barra muda com o perfil:
 * cliente vê o homebanking (vermelho Moza), admin vê o backoffice (escuro).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.isLoggedIn) {
      <nav [class.admin]="auth.isAdmin">
        <div class="nav-inner">
          <span class="brand-mark">MOZA</span>
          <span class="brand-sub">{{ auth.isAdmin ? 'Admin' : 'Cliente' }}</span>

          @if (auth.isAdmin) {
            <a routerLink="/admin/contas" routerLinkActive="active"><i class="bi bi-wallet2"></i> Contas</a>
            <a routerLink="/admin/pedidos" routerLinkActive="active"><i class="bi bi-inbox"></i> Pedidos</a>
            <a routerLink="/admin/contas/nova" routerLinkActive="active"><i class="bi bi-plus-circle"></i> Nova conta</a>
          } @else {
            <a routerLink="/inicio" routerLinkActive="active"><i class="bi bi-house"></i> Início</a>
            <a routerLink="/transferir" routerLinkActive="active"><i class="bi bi-arrow-left-right"></i> Transferir</a>
          }

          <span class="spacer"></span>
          <span class="user">{{ auth.username }} · {{ auth.isAdmin ? 'Administrador' : 'Cliente' }}</span>
          <a class="logout" (click)="logout()"><i class="bi bi-box-arrow-right"></i> Sair</a>
        </div>
      </nav>
    }
    <router-outlet />
  `,
  styles: `
    nav {
      background: var(--red);
      color: #fff;
    }
    nav.admin {
      background: var(--ink);
    }
    .nav-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 22px;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .nav-inner {
        gap: 14px;
      }
      .user {
        display: none;
      }
    }
    nav.admin .brand-mark {
      color: var(--red);
    }
    .brand-sub {
      font-size: 0.8rem;
      opacity: 0.85;
      border-left: 1px solid rgba(255, 255, 255, 0.4);
      padding-left: 12px;
      margin-left: -10px;
    }
    a {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      padding-bottom: 2px;
      border-bottom: 2px solid transparent;
    }
    a:hover {
      color: #fff;
    }
    a.active {
      color: #fff;
      border-bottom-color: currentColor;
    }
    nav.admin a.active {
      border-bottom-color: var(--red);
    }
    .spacer {
      flex: 1;
    }
    .user {
      font-size: 0.83rem;
      opacity: 0.85;
    }
    .logout {
      font-weight: 700;
    }
  `,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
