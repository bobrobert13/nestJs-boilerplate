require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Disable SSL verification for dev

const { Inngest } = require('inngest');

console.log('Event Key:', process.env.INNGEST_EVENT_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Signing Key:', process.env.INNGEST_SIGNING_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Base URL:', process.env.INNGEST_BASE_URL);

const inngest = new Inngest({
  id: 'test-client',
  baseUrl: process.env.INNGEST_BASE_URL || 'https://inngest.treborjs-dev.online/',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

async function test() {
  try {
    console.log('\nSending HOLA INNGEST event...');
    await inngest.send({
      name: 'scrapping/hola-inngest',
      data: {
        message: 'HOLA INNGEST',
        timestamp: new Date().toISOString(),
      },
    });
    console.log('✅ Event sent successfully! Check your Inngest dashboard.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
