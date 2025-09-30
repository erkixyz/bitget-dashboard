import { WebsocketClientV3, WS_KEY_MAP, RestClientV2 } from 'bitget-api';
import { readFileSync } from 'fs';

console.log('🚀 Testing Classic Futures Account...');

// Load config
const config = JSON.parse(readFileSync('./config.json', 'utf8'));
const account = config.accounts[0];

console.log(`🔐 Testing account: ${account.name}`);

// Test REST API first
console.log('\n📡 Testing REST API...');
const restClient = new RestClientV2({
  apiKey: account.apiKey,
  apiSecret: account.apiSecret,
  apiPass: account.passphrase,
});

async function testRestAPI() {
  try {
    // Check available methods first
    console.log('� Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(restClient)).filter(name => name.includes('get')));

    console.log('\n💼 Getting account assets...');
    try {
      const assets = await restClient.getFuturesAccountAssets('usdt-futures');
      console.log('✅ Account Assets:', JSON.stringify(assets, null, 2));
    } catch (e) {
      console.log('❌ Account assets failed:', e.message);
    }

    console.log('\n🎯 Getting positions...');
    try {
      const positions = await restClient.getFuturesPositions('usdt-futures');
      console.log('✅ Positions:', JSON.stringify(positions, null, 2));
    } catch (e) {
      console.log('❌ Positions failed:', e.message);
    }

    console.log('\n📋 Getting open orders...');
    try {
      const orders = await restClient.getFuturesOpenOrders('usdt-futures');
      console.log('✅ Open Orders:', JSON.stringify(orders, null, 2));
    } catch (e) {
      console.log('❌ Orders failed:', e.message);
    }  } catch (error) {
    console.error('❌ REST API Error:', error.message);
  }
}// Test WebSocket with different approaches
console.log('\n🔌 Testing WebSocket alternatives...');
const wsClient = new WebsocketClientV3({
  apiKey: account.apiKey,
  apiSecret: account.apiSecret,
  apiPass: account.passphrase,
});

wsClient.on('open', (data) => {
  console.log('✅ WebSocket opened:', data.wsKey);

  // Try different topic combinations for classic accounts
  console.log('\n🧪 Trying different WebSocket subscriptions...');

  // Method 1: Try without instType
  setTimeout(() => {
    console.log('1️⃣ Trying subscription without instType...');
    try {
      wsClient.subscribe([
        { topic: 'account' },
        { topic: 'positions' },
        { topic: 'orders' }
      ], WS_KEY_MAP.v3Private);
    } catch (e) { console.log('Failed:', e.message); }
  }, 1000);

  // Method 2: Try with different topic names
  setTimeout(() => {
    console.log('2️⃣ Trying alternative topic names...');
    try {
      wsClient.subscribe([
        { topic: 'balance', payload: { productType: 'usdt-futures' } },
        { topic: 'positions', payload: { productType: 'usdt-futures' } },
      ], WS_KEY_MAP.v3Private);
    } catch (e) { console.log('Failed:', e.message); }
  }, 2000);

  // Method 3: Try with productType instead of instType
  setTimeout(() => {
    console.log('3️⃣ Trying with productType...');
    try {
      wsClient.subscribe([
        { topic: 'account', payload: { productType: 'usdt-futures' } },
        { topic: 'position', payload: { productType: 'usdt-futures' } },
      ], WS_KEY_MAP.v3Private);
    } catch (e) { console.log('Failed:', e.message); }
  }, 3000);

  // Method 4: Try mix namespace
  setTimeout(() => {
    console.log('4️⃣ Trying mix namespace topics...');
    try {
      wsClient.subscribe([
        { topic: 'mix_account', payload: { instType: 'usdt-futures' } },
        { topic: 'mix_position', payload: { instType: 'usdt-futures' } },
      ], WS_KEY_MAP.v3Private);
    } catch (e) { console.log('Failed:', e.message); }
  }, 4000);
});

wsClient.on('update', (data) => {
  console.log('\n📊 SUCCESS! WebSocket data received:');
  console.log(JSON.stringify(data, null, 2));
});

wsClient.on('response', (data) => {
  console.log('📨 Response:', JSON.stringify(data, null, 2));
});

wsClient.on('exception', (data) => {
  console.log('❌ Exception:', JSON.stringify(data, null, 2));
});

// Start tests
testRestAPI().then(() => {
  console.log('\n✅ REST API tests completed');
});

// Keep alive
setInterval(() => {}, 1000);

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  wsClient.closeAll();
  process.exit(0);
});