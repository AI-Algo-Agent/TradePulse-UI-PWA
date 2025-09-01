export interface Trade {
  id?: string;
  symbol: string;
  description: string;
  date: string;
  sentiment: string;
  confidence: number;
  predictedPercent: number;
  entryPrice: number;
  targetPrice: number;
  stoploss: number;
  takeTrade: boolean;
  savedAt: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
}

export interface ZerodhaCredentials {
  apiKey: string;
  accessToken: string;
}

export interface MarketOrderRequest {
  symbol: string;
  quantity: number;
  transactionType: 'BUY' | 'SELL';
  orderType: 'MARKET';
  product: 'CNC' | 'MIS' | 'NRML';
}