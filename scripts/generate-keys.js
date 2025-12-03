const crypto = require('crypto');

function generateApiKey() {
  return 'API' + crypto.randomBytes(16).toString('hex');
}

function generateApiSecret() {
  return crypto.randomBytes(32).toString('base64');
}

const apiKey = generateApiKey();
const apiSecret = generateApiSecret();

console.log('Generated LiveKit Credentials:');
console.log('================================');
console.log(`LIVEKIT_API_KEY=${apiKey}`);
console.log(`LIVEKIT_API_SECRET=${apiSecret}`);
console.log('================================');
console.log('\nAdd these to your .env file');
