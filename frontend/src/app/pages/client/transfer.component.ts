import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Account, TransferResponse } from '../../core/models';

/** Transferência do cliente: a origem é sempre uma conta dele. */
@Component({
  selector: 'app-transfer',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="container">
      <h1>Transferência entre contas</h1>

      @if (myAccounts.length === 0) {
        <div class="card">
          <p class="muted">Ainda não tem nenhuma conta para transferir.</p>
        </div>
      } @else {
        <div class="card">
          <form (ngSubmit)="submit()">
            <label for="source">Conta de origem</label>
            <select id="source" name="source" [(ngModel)]="sourceAccountNumber">
              @for (account of myAccounts; track account.id) {
                <option [value]="account.accountNumber">
                  {{ account.accountNumber }} — {{ account.type === 'ORDEM' ? 'À ordem' : 'Poupança' }}
                  ({{ account.balance | currency : 'MZN' : 'symbol' : '1.2-2' }})
                </option>
              }
            </select>

            <label for="destination">Conta de destino</label>
            <input id="destination" name="destination" [(ngModel)]="destinationAccountNumber"
                   placeholder="número da conta de destino" required />

            <label for="amount">Valor (MZN)</label>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01"
                   [(ngModel)]="amount" required />

            <label for="description">Descrição</label>
            <input id="description" name="description" [(ngModel)]="description"
                   placeholder="ex.: renda de Julho" />

            @if (error) {
              <div class="error">{{ error }}</div>
            }
            @if (result) {
              <div class="success">
                Transferência de {{ result.amount | currency : 'MZN' : 'symbol' : '1.2-2' }}
                para a conta {{ result.destinationAccountNumber }} concluída.
                Novo saldo: {{ result.sourceBalanceAfter | currency : 'MZN' : 'symbol' : '1.2-2' }}
              </div>
            }

            <button type="submit" [disabled]="loading">Transferir</button>
          </form>
        </div>
      }
    </div>
  `,
})
export class TransferComponent implements OnInit {
  myAccounts: Account[] = [];
  sourceAccountNumber = '';
  destinationAccountNumber = '';
  amount: number | null = null;
  description = '';
  error = '';
  result: TransferResponse | null = null;
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.myAccounts().subscribe((accounts) => {
      this.myAccounts = accounts;
      if (accounts.length > 0) this.sourceAccountNumber = accounts[0].accountNumber;
    });
  }

  submit(): void {
    if (!this.amount) return;
    this.loading = true;
    this.error = '';
    this.result = null;

    this.api
      .transfer({
        sourceAccountNumber: this.sourceAccountNumber,
        destinationAccountNumber: this.destinationAccountNumber,
        amount: this.amount,
        description: this.description || undefined,
      })
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.result = result;
          this.destinationAccountNumber = '';
          this.amount = null;
          this.description = '';
          this.ngOnInit(); // actualiza os saldos mostrados na origem
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message ?? 'Erro ao efectuar a transferência';
        },
      });
  }
}
