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

// Constants for account WebSocket connections
const ACCOUNT_INST_TYPE = 'UTA'; // Note: all account events go on the UTA instType
const ACCOUNT_WS_KEY = WS_KEY_MAP.v3Private;

// Create WebSocket clients for each enabled account
const wsClients = [];

config.accounts.forEach(account => {
  if (account.enabled) {
    console.log(`🔐 Setting up account: ${account.name} (${account.id})`);

    // WebSocket client for real-time updates
    const wsClient = new WebsocketClientV3({
      apiKey: account.apiKey,
      apiSecret: account.apiSecret,
      apiPass: account.passphrase,
    });

    wsClients.push({ client: wsClient, account });
  }
});

// Setup WebSocket connections for real-time updates
function setupWebSocketConnections() {
  console.log('🔌 Setting up WebSocket connections...');

  wsClients.forEach(({ client, account }) => {
    console.log(`🔗 Connecting WebSocket for account: ${account.name}`);

    client.on('open', (data) => {
      console.log(`✅ WebSocket opened for ${account.name}:`, JSON.stringify(data, null, 2));

      // Subscribe to account events using UTA instType
      console.log(`📡 Attempting to subscribe for ${account.name}...`);

      try {
        client.subscribe([
          {
            topic: 'account',
            payload: {
              instType: ACCOUNT_INST_TYPE,
            },
          },
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
        ], ACCOUNT_WS_KEY);

        console.log(`📡 Successfully subscribed to account events for ${account.name} (UTA instType)`);
      } catch (error) {
        console.error(`❌ Subscription error for ${account.name}:`, error);
      }
    });

    client.on('update', (data) => {
      console.log(`\n📊 Raw message for ${account.name}:`);
      console.log(JSON.stringify(data, null, 2));

      if (data.arg && data.arg.topic === 'position') {
        console.log(`\n🎯 Position update for ${account.name}:`);

        if (data.data && data.data.length > 0) {
          data.data.forEach(position => {
            if (position.total && parseFloat(position.total) !== 0) {
              console.log(`  📈 ${position.symbol || position.instId}:`);
              console.log(`    Side: ${position.holdSide || position.posSide}`);
              console.log(`    Size: ${position.total || position.pos}`);
              console.log(`    Entry Price: ${position.averageOpenPrice || position.avgPx}`);
              console.log(`    Mark Price: ${position.markPrice || position.markPx}`);
              console.log(`    PnL: ${position.unrealizedPL || position.upl}`);
              console.log(`    Margin: ${position.margin || position.imr}`);
            }
          });
        }
      } else if (data.arg && data.arg.topic === 'account') {
        console.log(`\n💰 Account update for ${account.name}:`);
        if (data.data && data.data.length > 0) {
          const accountData = data.data[0];
          console.log(`  Equity: ${accountData.equity || accountData.totalEq || 'N/A'}`);
          console.log(`  Available: ${accountData.available || accountData.availEq || 'N/A'}`);
          console.log(`  Frozen: ${accountData.frozen || accountData.frozenBal || 'N/A'}`);
          console.log(`  Margin: ${accountData.margin || accountData.mgnRatio || 'N/A'}`);
        }
      } else if (data.arg && data.arg.topic === 'order') {
        console.log(`\n📋 Order update for ${account.name}:`);
        if (data.data && data.data.length > 0) {
          data.data.forEach(order => {
            console.log(`  🔸 ${order.symbol || order.instId}:`);
            console.log(`    Side: ${order.side}`);
            console.log(`    Size: ${order.size || order.sz}`);
            console.log(`    Price: ${order.price || order.px}`);
            console.log(`    Status: ${order.status || order.state}`);
            console.log(`    Order ID: ${order.orderId || order.ordId}`);
          });
        }
      } else if (data.arg && data.arg.topic === 'fill') {
        console.log(`\n✅ Fill update for ${account.name}:`);
        if (data.data && data.data.length > 0) {
          data.data.forEach(fill => {
            console.log(`  💱 ${fill.symbol || fill.instId}:`);
            console.log(`    Side: ${fill.side}`);
            console.log(`    Size: ${fill.size || fill.fillSz}`);
            console.log(`    Price: ${fill.price || fill.fillPx}`);
            console.log(`    Fee: ${fill.fee}`);
          });
        }
      }
    });

    client.on('response', (data) => {
      console.log(`📨 Response for ${account.name}:`, JSON.stringify(data, null, 2));
    });

    client.on('exception', (data) => {
      console.error(`❌ Exception for ${account.name}:`, JSON.stringify(data, null, 2));
    });

    client.on('error', (error) => {
      console.error(`💥 WebSocket error for ${account.name}:`, error);
    });

    client.on('close', (data) => {
      console.log(`🔌 WebSocket closed for ${account.name}:`, data);
    });

    client.on('reconnect', ({ wsKey }) => {
      console.log(`🔄 Reconnecting ${account.name}...`, wsKey);
    });

    client.on('reconnected', (data) => {
      console.log(`✅ Reconnected ${account.name}:`, data?.wsKey);
    });
  });
}

// Keep the process running and show connection status
function keepAlive() {
  let counter = 0;
  setInterval(() => {
    counter++;
    if (counter % 30 === 0) { // Every 30 seconds
      console.log(`\n🔍 Connection status check (${new Date().toLocaleTimeString()}):`);
      wsClients.forEach(({ client, account }) => {
        console.log(`  ${account.name}: ${client.isConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
      });
      console.log(`⏳ Still waiting for updates... (${counter}s)`);
    }
  }, 1000);
}

// Main execution
function main() {
  try {
    console.log('📡 Starting WebSocket connections...');
    setupWebSocketConnections();

    console.log('\n⏳ Waiting for account updates...');
    console.log('💡 Tip: Make some trades or changes to see position/account updates');
    console.log('Press Ctrl+C to exit');

    // Keep the process running
    keepAlive();

  } catch (error) {
    console.error('❌ Main execution error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing connections...');

  wsClients.forEach(({ client, account }) => {
    try {
      client.closeAll();
      console.log(`🔌 Closed WebSocket for ${account.name}`);
    } catch (error) {
      console.error(`❌ Error closing WebSocket for ${account.name}:`, error);
    }
  });

  process.exit(0);
});

// Start the application
main();
main();