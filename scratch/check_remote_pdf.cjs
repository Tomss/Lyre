const https = require('https');

const url = 'https://test.lalyre.fr/uploads/Lyrissimots_77__Mail_-1787904219936-163057.pdf';

console.log('Sending HEAD request to:', url);
const req = https.request(url, { method: 'HEAD' }, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  const sizeBytes = parseInt(res.headers['content-length'] || '0', 10);
  console.log(`Content-Length: ${sizeBytes} bytes (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
});

req.on('error', (err) => console.error('Request error:', err.message));
req.end();
