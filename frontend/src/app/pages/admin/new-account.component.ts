import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

/** Criação de contas — só acessível ao admin (guard + API). */
@Component({
  selector: 'app-new-account',
  imports: [FormsModule],
  template: `
    <div class="container">
      <h1>Nova conta bancária</h1>

      <div class="card">
        <form (ngSubmit)="submit()">
          <label for="customerName">Nome do cliente</label>
          <input id="customerName" name="customerName" [(ngModel)]="customerName" required />

          <label for="nuit">NUIT (9 dígitos)</label>
          <input id="nuit" name="nuit" [(ngModel)]="nuit" required pattern="[0-9]{9}" maxlength="9" />

          <label for="type">Tipo de conta</label>
          <select id="type" name="type" [(ngModel)]="type">
            <option value="ORDEM">À ordem</option>
            <option value="POUPANCA">Poupança</option>
          </select>

          <label for="initialBalance">Saldo inicial (MZN, minimo 500)</label>
          <input id="initialBalance" name="initialBalance" type="number" min="500" step="0.01"
                 [(ngModel)]="initialBalance" required />

          <label for="ownerUsername">Username do cliente (opcional)</label>
          <input id="ownerUsername" name="ownerUsername" [(ngModel)]="ownerUsername"
                 placeholder="deixe vazio se o cliente ainda não tem acesso" />

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <button type="submit" [disabled]="loading">Criar conta</button>
        </form>
      </div>
    </div>
  `,
})
export class NewAccountComponent {
  customerName = '';
  nuit = '';
  type = 'ORDEM';
  initialBalance = 500;
  ownerUsername = '';
  error = '';
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.api
      .createAccount({
        customerName: this.customerName,
        nuit: this.nuit,
        type: this.type,
        initialBalance: this.initialBalance,
        ownerUsername: this.ownerUsername || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/contas']),
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message ?? 'Erro ao criar a conta';
        },
      });
  }
}
