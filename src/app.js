const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const https = require('https');

//////// CONFIGURATION ///////////

// insert your own ssl certificate and keys
const options = {
  key: fs.readFileSync(path.join(__dirname, '..', 'ssl', 'key.pem'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, '..', 'ssl', 'cert.pem'), 'utf-8'),
};

const port = process.env.TRANSLATION_WEBRTC_PORT || 443;

////////////////////////////
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'node_modules')));

// const httpsServer = httpolyglot.createServer(options, app)
const httpsServer = https.createServer(options, app);
const io = require('socket.io')(httpsServer);
require('./socketController')(io);

httpsServer.listen(port, () => {
  console.log(`listening on port ${port}`);
});

http.createServer((req, res) => {
    console.log('http connect');
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
