const http = require('http');

const hostname = '0.0.0.0';
const port = 5173;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Diagnostic Success</h1><p>Node.js is working and can bind to port 5173.</p>');
});

server.listen(port, hostname, () => {
    console.log(`Diagnostic server running at http://${hostname}:${port}/`);
});

server.on('error', (e) => {
    console.error('Diagnostic server error:', e);
});
