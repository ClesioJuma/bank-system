import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Account } from '../../core/models';

/** Backoffice: todas as contas do banco, com pesquisa e indicadores. */
@Component({
  selector: 'app-admin-accounts',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <div class="container">
      <h1>Contas do banco</h1>

      <!-- Indicadores -->
      <div class="stats">
        <div class="card stat">
          <span class="muted">Contas</span>
          <strong>{{ accounts.length }}</strong>
        </div>
        <div class="card stat">
          <span class="muted">Total depositado</span>
          <strong>{{ total | currency : 'MZN' : 'symbol' : '1.2-2' }}</strong>
        </div>
        <div class="card stat">
          <span class="muted">Clientes com acesso</span>
          <strong>{{ withOwner }}</strong>
        </div>
      </div>

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      <div class="card">
        <input name="search" [(ngModel)]="search"
               placeholder="Pesquisar por nome, número de conta ou NUIT..." />

        @if (filtered.length === 0) {
          <p class="muted">
            {{ accounts.length === 0 ? 'Ainda não existem contas.' : 'Nenhuma conta corresponde à pesquisa.' }}
          </p>
        } @else {
          <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titular</th>
                <th>Nº de conta</th>
                <th>NUIT</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th class="num">Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (account of filtered; track account.id) {
                <tr>
                  <td><strong>{{ account.customerName }}</strong></td>
                  <td>{{ account.accountNumber }}</td>
                  <td>{{ account.nuit }}</td>
                  <td>
                    <span class="badge">{{ account.type === 'ORDEM' ? 'À ordem' : 'Poupança' }}</span>
                  </td>
                  <td class="muted">{{ account.ownerUsername ?? '—' }}</td>
                  <td class="num"><strong>{{ account.balance | currency : 'MZN' : 'symbol' : '1.2-2' }}</strong></td>
                  <td class="num">
                    <a [routerLink]="['/contas', account.id, 'extracto']"><i class="bi bi-list-ul"></i> Extracto</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 640px) {
      .stats {
        grid-template-columns: 1fr;
      }
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 18px 20px;
    }
    .stat strong {
      font-size: 1.3rem;
    }
    input {
      margin-bottom: 16px;
    }
    .num {
      text-align: right;
    }
    a {
      font-size: 0.85rem;
      color: var(--red);
      font-weight: 600;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `,
})
export class AdminAccountsComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  search = '';
  error = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService) {}

  get total(): number {
    return this.accounts.reduce((sum, a) => sum + a.balance, 0);
  }

  get withOwner(): number {
    return this.accounts.filter((a) => a.ownerUsername).length;
  }

  get filtered(): Account[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.accounts;
    return this.accounts.filter(
      (a) =>
        a.customerName.toLowerCase().includes(term) ||
        a.accountNumber.includes(term) ||
        a.nuit.includes(term)
    );
  }

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  load(): void {
    this.api.allAccounts().subscribe({
      next: (accounts) => (this.accounts = accounts),
      error: (err) => (this.error = err.error?.message ?? 'Erro ao carregar as contas'),
    });
  }
}
