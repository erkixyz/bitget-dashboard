import { WebsocketClientV2 } from 'bitget-api';
import { readFileSync } from 'fs';

console.log('🚀 Starting Bitget positions test...');

// Load config
let config;
try {
  config = JSON.parse(readFileSync('./config.json', 'utf8'));
  console.log(`📋 Loaded config with ${config.accounts.length} accounts`);
} catch (error) {
  console.error('❌ Error loading config.json:', error);
  process.exit(1);
}

const account = config.accounts[0];

const wsClient = new WebsocketClientV2({
  apiKey: account.apiKey,
  apiSecret: account.apiSecret,
  apiPass: account.apiPass,
});

// Handle incoming messages
wsClient.on('update', (data) => {
  console.log('WS update received: ', data);
});

wsClient.on('open', (data) => {
  console.log('WS connection opened: ', data.wsKey);
});

wsClient.on('reconnected', (data) => {
  console.log('WS reconnected: ', data?.wsKey);
});

wsClient.on('exception', (data) => {
  console.log('WS error: ', data);
});

// Subscribe to public data streams
// wsClient.subscribeTopic('SPOT', 'ticker', 'BTCUSDT');

// Subscribe to private data streams (requires authentication)
// wsClient.subscribeTopic('USDT-FUTURES', 'account');
// wsClient.subscribeTopic('USDT-FUTURES', 'positions');
wsClient.subscribeTopic('USDT-FUTURES', 'orders');
