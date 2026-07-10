import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AccountRequestInfo } from '../../core/models';

/** Backoffice: pedidos de abertura de conta à espera de decisão. */
@Component({
  selector: 'app-admin-requests',
  imports: [DatePipe, FormsModule],
  template: `
    <div class="container">
      <h1>Pedidos de abertura de conta</h1>

      @if (error) {
        <div class="error">{{ error }}</div>
      }
      @if (message) {
        <div class="success">{{ message }}</div>
      }

      @if (requests.length === 0) {
        <div class="card">
          <p class="muted">Não há pedidos pendentes.</p>
        </div>
      }

      @for (request of requests; track request.id) {
        <div class="card request-row">
          <div>
            <strong>{{ request.customerName }}</strong>
            <span class="badge">{{ request.type === 'ORDEM' ? 'À ordem' : 'Poupança' }}</span>
            <div class="muted">
              NUIT {{ request.nuit }} · utilizador {{ request.username }}
              · pedido a {{ request.createdAt | date : 'dd/MM/yyyy HH:mm' }}
            </div>
          </div>
          <div class="actions">
            <input name="deposit-{{ request.id }}" type="number" min="500" step="0.01"
                   [(ngModel)]="deposits[request.id]" placeholder="Depósito inicial (min. 500)" />
            <button (click)="approve(request)" [disabled]="busy">Aprovar</button>
            <button class="reject" (click)="reject(request)" [disabled]="busy">Rejeitar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .request-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .badge {
      margin-left: 8px;
    }
    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .actions input {
      width: 180px;
    }
    .actions button {
      margin-top: 0;
    }
    .reject {
      background: #fff;
      color: var(--red-dark);
      border: 1px solid var(--red-dark);
    }
    .reject:hover {
      background: var(--red-soft);
    }
  `,
})
export class AdminRequestsComponent implements OnInit, OnDestroy {
  requests: AccountRequestInfo[] = [];
  deposits: Record<number, number> = {};
  error = '';
  message = '';
  busy = false;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  load(): void {
    this.api.pendingRequests().subscribe({
      next: (requests) => (this.requests = requests),
      error: (err) => (this.error = err.error?.message ?? 'Erro ao carregar os pedidos'),
    });
  }

  approve(request: AccountRequestInfo): void {
    this.decide(
      this.api.approveRequest(request.id, this.deposits[request.id] ?? 0),
      `Pedido de ${request.customerName} aprovado — conta criada.`
    );
  }

  reject(request: AccountRequestInfo): void {
    this.decide(this.api.rejectRequest(request.id), `Pedido de ${request.customerName} rejeitado.`);
  }

  private decide(call: ReturnType<ApiService['approveRequest']>, successMessage: string): void {
    this.busy = true;
    this.error = '';
    this.message = '';
    call.subscribe({
      next: () => {
        this.busy = false;
        this.message = successMessage;
        this.load();
      },
      error: (err) => {
        this.busy = false;
        this.error = err.error?.message ?? 'Erro ao processar o pedido';
      },
    });
  }
}
