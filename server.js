const fs = require("fs");
const http = require("http");
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || process.env.HOST || "0.0.0.0";

const standaloneCandidates = [
  path.join(__dirname, ".next", "standalone", "server.js"),
  path.join(process.cwd(), ".next", "standalone", "server.js"),
  path.join(process.cwd(), "standalone", "server.js")
];

const standaloneServerPath = standaloneCandidates.find((candidate) => fs.existsSync(candidate));

if (standaloneServerPath) {
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;
  console.log(`Starting Dijital Iz Avcisi standalone server from ${standaloneServerPath}`);
  console.log(`Host: ${hostname}`);
  console.log(`Port: ${port}`);
  require(standaloneServerPath);
} else {
  const next = require("next");
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  app
    .prepare()
    .then(() => {
      http
        .createServer((request, response) => {
          handle(request, response);
        })
        .listen(port, hostname, () => {
          console.log(`Starting Dijital Iz Avcisi Next server`);
          console.log(`Host: ${hostname}`);
          console.log(`Port: ${port}`);
        });
    })
    .catch((error) => {
      console.error("Failed to start Dijital Iz Avcisi Next server", error);
      process.exit(1);
    });
}
