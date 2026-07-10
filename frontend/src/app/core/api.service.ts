import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Account, AccountRequestInfo, StatementEntry, TransferResponse } from './models';
import { API_URL } from './auth.service';

/** Chamadas à API de contas e transferências. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Admin: todas as contas; cliente: só as suas
  allAccounts() {
    return this.http.get<Account[]>(`${API_URL}/accounts`);
  }

  myAccounts() {
    return this.http.get<Account[]>(`${API_URL}/accounts/mine`);
  }

  createAccount(data: {
    customerName: string;
    nuit: string;
    type: string;
    initialBalance: number;
    ownerUsername?: string;
  }) {
    return this.http.post<Account>(`${API_URL}/accounts`, data);
  }

  account(accountId: number) {
    return this.http.get<Account>(`${API_URL}/accounts/${accountId}`);
  }

  deposit(accountId: number, amount: number, description?: string) {
    return this.http.post<Account>(`${API_URL}/accounts/${accountId}/deposit`, { amount, description });
  }

  statement(accountId: number) {
    return this.http.get<StatementEntry[]>(`${API_URL}/accounts/${accountId}/statement`);
  }

  // Pedidos de abertura de conta
  myRequests() {
    return this.http.get<AccountRequestInfo[]>(`${API_URL}/account-requests/mine`);
  }

  createRequest(type: string) {
    return this.http.post<AccountRequestInfo>(`${API_URL}/account-requests`, { type });
  }

  pendingRequests() {
    return this.http.get<AccountRequestInfo[]>(`${API_URL}/account-requests/pending`);
  }

  approveRequest(id: number, initialBalance: number) {
    return this.http.post<AccountRequestInfo>(`${API_URL}/account-requests/${id}/approve`, { initialBalance });
  }

  rejectRequest(id: number) {
    return this.http.post<AccountRequestInfo>(`${API_URL}/account-requests/${id}/reject`, {});
  }

  transfer(data: {
    sourceAccountNumber: string;
    destinationAccountNumber: string;
    amount: number;
    description?: string;
  }) {
    return this.http.post<TransferResponse>(`${API_URL}/transfers`, data);
  }
}
