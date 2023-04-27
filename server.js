// import https from 'https';
// import fs from 'fs';
import app from './src/app.js';

// // Read certificate and private key files
// const privateKey = fs.readFileSync('/path/to/private.key');
// const certificate = fs.readFileSync('/path/to/certificate.crt');

// // Create server with HTTPS options
// const server = https.createServer(
//   {
//     key: privateKey,
//     cert: certificate,
//   },
//   app
// );

// // Start server
// server.listen(443, () => {
//   console.log('Server listening on port 443');
// });

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
