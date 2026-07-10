import { Routes } from '@angular/router';
import { authGuard, adminGuard, clientGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login.component';
import { ClientHomeComponent } from './pages/client/home.component';
import { TransferComponent } from './pages/client/transfer.component';
import { StatementComponent } from './pages/statement.component';
import { AdminAccountsComponent } from './pages/admin/accounts.component';
import { NewAccountComponent } from './pages/admin/new-account.component';
import { AdminRequestsComponent } from './pages/admin/requests.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Módulo do cliente (homebanking)
  { path: 'inicio', component: ClientHomeComponent, canActivate: [authGuard, clientGuard] },
  { path: 'transferir', component: TransferComponent, canActivate: [authGuard, clientGuard] },

  // Extracto é partilhado: cliente vê o seu, admin vê qualquer um
  { path: 'contas/:id/extracto', component: StatementComponent, canActivate: [authGuard] },

  // Módulo de administração (backoffice)
  { path: 'admin/contas', component: AdminAccountsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/contas/nova', component: NewAccountComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/pedidos', component: AdminRequestsComponent, canActivate: [authGuard, adminGuard] },

  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
