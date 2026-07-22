const http = require('http');
const https = require('https');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.LINE_NOTIFY_TOKEN;

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/notify') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const message = payload.message;

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        if (!TOKEN) {
          console.error('LINE_NOTIFY_TOKEN environment variable is not set!');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server configuration error: Token not set' }));
          return;
        }

        // Outgoing request to LINE Notify API
        const postData = querystring.stringify({ message: message });
        const options = {
          hostname: 'notify-api.line.me',
          path: '/api/notify',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${TOKEN}`
          }
        };

        const lineReq = https.request(options, (lineRes) => {
          let lineBody = '';
          lineRes.on('data', d => {
            lineBody += d;
          });

          lineRes.on('end', () => {
            res.writeHead(lineRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(lineBody);
          });
        });

        lineReq.on('error', (e) => {
          console.error('LINE Notify request failed:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to contact LINE Notify API' }));
        });

        lineReq.write(postData);
        lineReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`LINE Notify proxy server listening on port ${PORT}`);
});
