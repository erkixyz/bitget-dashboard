import { WebsocketClientV3, WS_KEY_MAP } from 'bitget-api';
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

// Constants for account WebSocket connections
const ACCOUNT_INST_TYPE = 'UTA'; // Note: all account events go on the UTA instType
const ACCOUNT_WS_KEY = WS_KEY_MAP.v3Private;

// Create WebSocket clients for each enabled account
console.log(`🔐 Setting up account: ${account.name} (${account.id})`);

// WebSocket client for real-time updates
const client = new WebsocketClientV3({
  apiKey: account.apiKey,
  apiSecret: account.apiSecret,
  apiPass: account.passphrase,
});


console.log(`🔗 Connecting WebSocket for account: ${account.name}`);

client.on('update', (data) => {
  console.log('WS raw message received ', data);
});

client.on('open', (data) => {
  console.log('WS connection opened:', data.wsKey);
});
client.on('response', (data) => {
  console.log('WS response: ', JSON.stringify(data, null, 2));
});
client.on('reconnect', ({ wsKey }) => {
  console.log('WS automatically reconnecting.... ', wsKey);
});
client.on('reconnected', (data) => {
  console.log('WS reconnected ', data?.wsKey);
});
client.on('exception', (data) => {
  console.log('WS error', data);
});

client.subscribe(
  [
    {
      topic: 'position',
      payload: {
        instType: ACCOUNT_INST_TYPE,
      },
    },
    {
      topic: 'fill',
      payload: {
        instType: ACCOUNT_INST_TYPE,
      },
    },
    {
      topic: 'order',
      payload: {
        instType: ACCOUNT_INST_TYPE,
      },
    },
  ],
  WS_KEY_MAP.v3Private
);

// Keep the process running and show connection status
function keepAlive() {
  setInterval(() => {}, 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing connections...');

    try {
      client.closeAll();
      console.log(`🔌 Closed WebSocket for ${account.name}`);
    } catch (error) {
      console.error(`❌ Error closing WebSocket for ${account.name}:`, error);
    }

  process.exit(0);
});

// Keep the process running
keepAlive();
