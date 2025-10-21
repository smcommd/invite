#!/usr/bin/env node
/**
 * Prints the local and network URLs before the Next.js dev server starts.
 * Helpful when sharing the preview across devices on the same network.
 */
const os = require("os");

const PORT = process.env.PORT || 3001;
const interfaces = os.networkInterfaces();

const addresses = Object.values(interfaces)
  .flat()
  .filter(Boolean)
  .filter((iface) => iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

const uniqueAddresses = [...new Set(addresses)];

console.log("");
console.log("  Dev server URLs");
console.log("  - Local:    http://localhost:" + PORT);

if (uniqueAddresses.length > 0) {
  uniqueAddresses.forEach((address, index) => {
    const prefix = index === 0 ? "-" : " ";
    console.log(`  ${prefix} Network: http://${address}:${PORT}`);
  });
} else {
  console.log("  - Network:  (no active IPv4 address found)");
}

console.log("");

