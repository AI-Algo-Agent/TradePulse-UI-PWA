import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Trade } from '../models/trade.model';
import { ZerodhaService } from './zerodha.service';

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  private tradesSubject = new BehaviorSubject<Trade[]>(this.getStoredTrades());
  private refreshInterval: any;

  constructor(private zerodhaService: ZerodhaService) {
    this.startAutoRefresh();
    this.fetchAndStoreTrades();
  }

  getTrades(): Observable<Trade[]> {
    return this.tradesSubject.asObservable();
  }

  private getStoredTrades(): Trade[] {
    this.fetchAndStoreTrades();
    const stored = localStorage.getItem('finalisedTrades');
    return stored ? JSON.parse(stored) : [];
  }

  fetchAndStoreTrades(): void {
    this.zerodhaService.getFinalisedTrades().subscribe((trades) => {
      this.storeTrades(trades);
    });
  }

  private storeTrades(trades: Trade[]): void {
    localStorage.setItem('finalisedTrades', JSON.stringify(trades));
    this.tradesSubject.next(trades);
  }

  refreshTrades(): void {
    // In a real app, this would call an API
    // For now, we'll just update the timestamp
    const trades = this.getStoredTrades().map(trade => ({
      ...trade,
      savedAt: new Date().toISOString()
    }));
    this.storeTrades(trades);
  }

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshTrades();
    }, 10000); // Refresh every 10 seconds
  }

  removeTrade(tradeId: string): void {
    const trades = this.getStoredTrades().filter(trade => trade.id !== tradeId);
    this.storeTrades(trades);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}