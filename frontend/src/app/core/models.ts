// Tipos que espelham as respostas da API

export interface AuthResponse {
  token: string;
  username: string;
  role: 'ADMIN' | 'CLIENT';
}

export interface Account {
  id: number;
  customerName: string;
  nuit: string;
  accountNumber: string;
  type: 'ORDEM' | 'POUPANCA';
  balance: number;
  ownerUsername: string | null;
  createdAt: string;
}

export interface StatementEntry {
  dateTime: string;
  type: 'DEPOSITO_INICIAL' | 'DEPOSITO' | 'TRANSFERENCIA_ENVIADA' | 'TRANSFERENCIA_RECEBIDA';
  amount: number;
  resultingBalance: number;
  description: string;
}

export interface AccountRequestInfo {
  id: number;
  username: string;
  customerName: string;
  nuit: string;
  type: 'ORDEM' | 'POUPANCA';
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  createdAt: string;
  decidedAt: string | null;
}

export interface TransferResponse {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  sourceBalanceAfter: number;
  description: string;
  dateTime: string;
}
