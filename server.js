// server.js
const http = require("http");
const next = require("next");

const port = process.env.PORT || 3000;     // Hostinger inyecta PORT
const hostname = "0.0.0.0";                // Escucha en todas las interfaces
const dev = false;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`> Next.js listo en http://${hostname}:${port}`);
  });
});
