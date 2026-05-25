const path = require("path");

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

try {
  require(standaloneServer);
} catch (error) {
  console.error("Failed to start Dijital Iz Avcisi standalone server.");
  console.error("Expected build output:", standaloneServer);
  console.error("Run `npm run build` on the deployment server before `npm start`.");
  console.error(error);
  process.exit(1);
}
