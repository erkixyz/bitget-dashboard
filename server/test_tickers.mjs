import { WebsocketClientV3, WS_KEY_MAP } from 'bitget-api';

console.log('🚀 Starting Bitget ticker test...');

const wsClient = new WebsocketClientV3();

wsClient.on('open', (data) => {
  console.log('✅ WebSocket opened:', data.wsKey);
});

wsClient.on('update', (data) => {
  console.log('📊 Raw ticker data:', JSON.stringify(data, null, 2));
});

wsClient.on('response', (data) => {
  console.log('📨 Response:', JSON.stringify(data, null, 2));
});

wsClient.on('exception', (data) => {
  console.error('❌ Exception:', data);
});

wsClient.on('reconnect', ({ wsKey }) => {
  console.log('🔄 Reconnecting...', wsKey);
});

wsClient.on('reconnected', (data) => {
  console.log('✅ Reconnected:', data?.wsKey);
});

// Subscribe to USDT futures tickers
console.log('📝 Subscribing to tickers...');

wsClient.subscribe([
  {
    topic: 'ticker',
    payload: {
      instType: 'usdt-futures',
      symbol: 'BTCUSDT',
    },
  },
  {
    topic: 'ticker',
    payload: {
      instType: 'usdt-futures',
      symbol: 'ETHUSDT',
    },
  },
  {
    topic: 'ticker',
    payload: {
      instType: 'usdt-futures',
      symbol: 'BNBUSDT',
    },
  },
], WS_KEY_MAP.v3Public);

console.log('⏳ Waiting for ticker data...');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  process.exit(0);
});