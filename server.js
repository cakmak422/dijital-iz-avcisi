process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

const { startServer } = require("next/dist/server/lib/start-server");

startServer({
  dir: __dirname,
  isDev: false,
  hostname: process.env.HOSTNAME,
  port: Number(process.env.PORT),
  allowRetry: false
}).catch((error) => {
  console.error("Failed to start Dijital Iz Avcisi Next.js server.");
  console.error("Run `npm install && npm run build` before `npm start`.");
  console.error(error);
  process.exit(1);
});
