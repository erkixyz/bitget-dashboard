export interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  timestamp: number;
}

export interface ClientMessage {
  type: 'subscribe' | 'unsubscribe';
  symbols: string[];
}

export interface ServerMessage {
  type: 'ticker' | 'error' | 'connected';
  data?: TickerData | TickerData[];
  error?: string;
}
