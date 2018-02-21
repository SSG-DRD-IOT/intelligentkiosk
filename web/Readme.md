**Alexa Documentation**

**Troubleshooting**
Error: Server Certificate not found
Fix: Set the full path of the directory for server.key and server.crt in the following code residing in server.js

const options = {
  // Private Key
  key: fs.readFileSync('/home/intel/Downloads/intelligentkiosk/web/ssl/server.key'),

  // SSL Certficate
  cert: fs.readFileSync('/home/intel/Downloads/intelligentkiosk/web/ssl/server.crt'),

  // Make sure an error is not emitted on connection when the server certificate verification against the list of supplied CAs fails.
  rejectUnauthorized: false
};

