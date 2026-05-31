const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, ".next", "standalone", "server.js"),
  path.join(process.cwd(), ".next", "standalone", "server.js"),
  path.join(process.cwd(), "standalone", "server.js"),
  path.join(process.cwd(), "server.js")
];

const serverPath = candidates.find((candidate) => fs.existsSync(candidate));

if (!serverPath) {
  console.error("Next standalone server file was not found.");
  console.error("Checked paths:");
  for (const candidate of candidates) {
    console.error(`- ${candidate}`);
  }
  process.exit(1);
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || process.env.HOST || "0.0.0.0";

console.log(`Starting Dijital Iz Avcisi from ${serverPath}`);
console.log(`Host: ${process.env.HOSTNAME}`);
console.log(`Port: ${process.env.PORT}`);

require(serverPath);
