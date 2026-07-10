import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Account, StatementEntry } from '../core/models';

@Component({
  selector: 'app-statement',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="container">
      <a [routerLink]="backLink" class="back muted"><i class="bi bi-arrow-left"></i> Voltar às contas</a>
      <h1>Extracto de movimentos</h1>

      @if (account) {
        <div class="card summary">
          <div>
            <strong>{{ account.customerName }}</strong>
            <div class="muted">Conta {{ account.accountNumber }}
              · {{ account.type === 'ORDEM' ? 'À ordem' : 'Poupança' }}</div>
          </div>
          <div class="right">
            <span class="muted">Saldo actual</span>
            <div class="balance">{{ account.balance | currency : 'MZN' : 'symbol' : '1.2-2' }}</div>
          </div>
        </div>
      }

      <!-- Depósito ao balcão: só o admin vê -->
      @if (isAdmin && account) {
        <div class="card">
          <h2>Depositar nesta conta</h2>
          <form (ngSubmit)="deposit()" class="deposit-form">
            <input name="depositAmount" type="number" min="100" step="0.01"
                   [(ngModel)]="depositAmount" placeholder="Valor (MZN, minimo 100)" required />
            <input name="depositDescription" [(ngModel)]="depositDescription"
                   placeholder="Descrição (opcional)" />
            <button type="submit" [disabled]="depositing">Depositar</button>
          </form>
          @if (depositMessage) {
            <div class="success">{{ depositMessage }}</div>
          }
        </div>
      }

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (entries.length > 0) {
        <div class="card">
          <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>Operação</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Saldo resultante</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries; track entry.dateTime) {
                <tr>
                  <td>{{ entry.dateTime | date : 'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="badge" [class.green]="entry.type !== 'TRANSFERENCIA_ENVIADA'"
                          [class.red]="entry.type === 'TRANSFERENCIA_ENVIADA'">
                      {{ label(entry.type) }}
                    </span>
                  </td>
                  <td>{{ entry.description }}</td>
                  <td [class.negative]="entry.type === 'TRANSFERENCIA_ENVIADA'">
                    {{ entry.type === 'TRANSFERENCIA_ENVIADA' ? '-' : '+' }}
                    {{ entry.amount | currency : 'MZN' : 'symbol' : '1.2-2' }}
                  </td>
                  <td>{{ entry.resultingBalance | currency : 'MZN' : 'symbol' : '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        </div>
      } @else if (!error) {
        <div class="card">
          <p class="muted">Esta conta ainda não tem movimentos.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .back {
      text-decoration: none;
    }
    .back:hover {
      color: var(--red);
    }
    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .right {
      text-align: right;
    }
    .balance {
      font-size: 1.35rem;
      font-weight: 700;
    }
    .negative {
      color: var(--red-dark);
    }
    .deposit-form {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .deposit-form input {
      flex: 1;
      min-width: 160px;
    }
    .deposit-form button {
      margin-top: 0;
    }
  `,
})
export class StatementComponent implements OnInit {
  account: Account | null = null;
  entries: StatementEntry[] = [];
  error = '';
  depositAmount: number | null = null;
  depositDescription = '';
  depositMessage = '';
  depositing = false;

  constructor(private api: ApiService, private route: ActivatedRoute, private auth: AuthService) {}

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  // Cada perfil volta para o seu módulo
  get backLink(): string {
    return this.auth.isAdmin ? '/admin/contas' : '/inicio';
  }

  deposit(): void {
    if (!this.account || !this.depositAmount) return;
    this.depositing = true;
    this.depositMessage = '';
    this.error = '';

    this.api.deposit(this.account.id, this.depositAmount, this.depositDescription || undefined).subscribe({
      next: (account) => {
        this.depositing = false;
        this.depositMessage = 'Depósito efectuado com sucesso.';
        this.depositAmount = null;
        this.depositDescription = '';
        this.account = account;
        this.ngOnInit(); // recarrega o extracto
      },
      error: (err) => {
        this.depositing = false;
        this.error = err.error?.message ?? 'Erro ao efectuar o depósito';
      },
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.account(id).subscribe({
      next: (account) => (this.account = account),
      error: () => {}, // o erro visível vem do pedido do extracto
    });

    this.api.statement(id).subscribe({
      next: (entries) => (this.entries = entries),
      error: (err) =>
        (this.error =
          err.status === 403
            ? 'Não tem acesso ao extracto desta conta'
            : err.error?.message ?? 'Erro ao carregar o extracto'),
    });
  }

  label(type: StatementEntry['type']): string {
    switch (type) {
      case 'DEPOSITO_INICIAL':
        return 'Depósito inicial';
      case 'DEPOSITO':
        return 'Depósito';
      case 'TRANSFERENCIA_ENVIADA':
        return 'Transferência enviada';
      case 'TRANSFERENCIA_RECEBIDA':
        return 'Transferência recebida';
    }
  }
}
