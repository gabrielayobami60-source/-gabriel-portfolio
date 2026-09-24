const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8743;
const root = __dirname;
const types = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.pdf': 'application/pdf', '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let filePath = decodeURIComponent(req.url.split('?')[0]);
  if (filePath === '/') filePath = '/index.html';
  filePath = path.join(root, filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '0.0.0.0', () => console.log('Serving on', port));
