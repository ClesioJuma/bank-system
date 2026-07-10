import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Account, AccountRequestInfo } from '../../core/models';

/** Página inicial do cliente: as suas contas e os pedidos de abertura. */
@Component({
  selector: 'app-client-home',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="container">
      <h1>As minhas contas</h1>

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @for (account of accounts; track account.id) {
        <div class="card account-row">
          <div>
            <strong>{{ account.customerName }}</strong>
            <span class="badge">{{ account.type === 'ORDEM' ? 'À ordem' : 'Poupança' }}</span>
            <div class="muted">Conta {{ account.accountNumber }} · NUIT {{ account.nuit }}</div>
          </div>
          <div class="right">
            <div class="balance">{{ account.balance | currency : 'MZN' : 'symbol' : '1.2-2' }}</div>
            <a [routerLink]="['/contas', account.id, 'extracto']"><i class="bi bi-list-ul"></i> Extracto</a>
            <a routerLink="/transferir"><i class="bi bi-arrow-left-right"></i> Transferir</a>
          </div>
        </div>
      }

      <!-- Pedidos de abertura -->
      @if (requests.length > 0) {
        <h2>Pedidos de abertura</h2>
        @for (request of requests; track request.id) {
          <div class="card request-row">
            <div>
              <strong>Conta {{ request.type === 'ORDEM' ? 'à ordem' : 'poupança' }}</strong>
              <div class="muted">Pedido a {{ request.createdAt | date : 'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <span class="badge"
                  [class.green]="request.status === 'APROVADO'"
                  [class.red]="request.status === 'REJEITADO'">
              {{ request.status }}
            </span>
          </div>
        }
      }

      <!-- Sem contas e sem pedido pendente: convida a pedir a abertura -->
      @if (!hasPending) {
        <div class="card">
          <h2>{{ accounts.length === 0 ? 'Ainda não tem nenhuma conta' : 'Abrir outra conta' }}</h2>
          <p class="muted">Peça a abertura de uma conta — o banco analisa e aprova.</p>
          <form (ngSubmit)="request()" class="request-form">
            <select name="type" [(ngModel)]="type">
              <option value="ORDEM">Conta à ordem</option>
              <option value="POUPANCA">Conta poupança</option>
            </select>
            <button type="submit" [disabled]="requesting">Pedir abertura de conta</button>
          </form>
        </div>
      }
    </div>
  `,
  styles: `
    .account-row,
    .request-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .right {
        text-align: left;
        flex-direction: row;
        gap: 14px;
        align-items: center;
      }
      .request-form {
        flex-direction: column;
        align-items: stretch;
      }
      .request-form select {
        max-width: none;
      }
    }
    .badge {
      margin-left: 8px;
    }
    .request-row .badge {
      margin-left: 0;
    }
    .right {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .balance {
      font-size: 1.25rem;
      font-weight: 700;
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
    .request-form {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .request-form select {
      max-width: 240px;
    }
    .request-form button {
      margin-top: 0;
      white-space: nowrap;
    }
  `,
})
export class ClientHomeComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  requests: AccountRequestInfo[] = [];
  type = 'ORDEM';
  error = '';
  requesting = false;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService) {}

  get hasPending(): boolean {
    return this.requests.some((r) => r.status === 'PENDENTE');
  }

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  load(): void {
    this.api.myAccounts().subscribe({
      next: (accounts) => (this.accounts = accounts),
      error: (err) => (this.error = err.error?.message ?? 'Erro ao carregar as contas'),
    });
    this.api.myRequests().subscribe((requests) => (this.requests = requests));
  }

  request(): void {
    this.requesting = true;
    this.api.createRequest(this.type).subscribe({
      next: () => {
        this.requesting = false;
        this.load();
      },
      error: (err) => {
        this.requesting = false;
        this.error = err.error?.message ?? 'Erro ao criar o pedido';
      },
    });
  }
}
