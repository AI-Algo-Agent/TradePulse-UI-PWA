import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZerodhaCredentials, Holding, MarketOrderRequest, Trade } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class ZerodhaService {
  private baseUrl = `http://${window.location.hostname}:3001`;

  private credentialsSubject = new BehaviorSubject<ZerodhaCredentials | null>(this.getStoredCredentials());

  constructor(private http: HttpClient) {}

  // Authentication
  authenticateWithRefreshToken(apiKey: string, apiSecret: string, requestToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/zerodha/token`, {
      apiKey,
      apiSecret,
      requestToken
    });
  }

  storeCredentials(apiKey: string, accessToken: string): void {
    const credentials: ZerodhaCredentials = { apiKey, accessToken };
    localStorage.setItem('zerodhaCredentials', JSON.stringify(credentials));
    this.credentialsSubject.next(credentials);
  }

  getCredentials(): ZerodhaCredentials | null {
    return this.credentialsSubject.value;
  }

  private getStoredCredentials(): ZerodhaCredentials | null {
    const stored = localStorage.getItem('zerodhaCredentials');
    return stored ? JSON.parse(stored) : null;
  }

  clearCredentials(): void {
    localStorage.removeItem('zerodhaCredentials');
    this.credentialsSubject.next(null);
  }

  // API calls
  getAccountDetails(): Observable<any> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }

    const params = new HttpParams()
      .set('apiKey', credentials.apiKey)
      .set('accessToken', credentials.accessToken);

    return this.http.get(`${this.baseUrl}/api/zerodha/account-details`, { params });
  }

  getMargins(): Observable<any> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }

    const params = new HttpParams()
      .set('apiKey', credentials.apiKey)
      .set('accessToken', credentials.accessToken);

    return this.http.get(`${this.baseUrl}/api/zerodha/margins`, { params });
  }

  getHoldings(): Observable<Holding[]> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }

    const params = new HttpParams()
      .set('apiKey', credentials.apiKey)
      .set('accessToken', credentials.accessToken);

    return this.http.get<Holding[]>(`${this.baseUrl}/api/zerodha/holdings`, { params });
  }

  placeMarketOrder(order: MarketOrderRequest): Observable<any> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }

    return this.http.post(`${this.baseUrl}/api/zerodha/market-order`, {
      ...order,
      apiKey: credentials.apiKey,
      accessToken: credentials.accessToken
    });
  }
  getFinalisedTrades(): Observable<Trade[]> {
      return this.http.get<Trade[]>(`${this.baseUrl}/api/zerodha/finalised-trades`);
    }
}