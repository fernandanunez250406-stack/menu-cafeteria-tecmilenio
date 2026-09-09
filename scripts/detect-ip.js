const os = require("os");
const fs = require("fs");
const path = require("path");

const interfaces = os.networkInterfaces();

const candidates = [];

for (const [name, addresses] of Object.entries(interfaces)) {
  for (const address of addresses || []) {
    if (
      address.family === "IPv4" &&
      !address.internal &&
      !address.address.startsWith("127.")
    ) {
      candidates.push({
        name,
        address: address.address,
      });
    }
  }
}

if (candidates.length === 0) {
  console.error("No se encontró una IPv4 local.");
  process.exit(1);
}

const preferred =
  candidates.find(({ address }) => address.startsWith("192.168.")) ??
  candidates.find(({ address }) => address.startsWith("10.")) ??
  candidates[0];

const apiUrl = `http://${preferred.address}:3000/api`;

const envPath = path.join(process.cwd(), ".env.local");

fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${apiUrl}\n`, "utf8");

console.log("");
console.log("IPv4 detectada:", preferred.address);
console.log("API:", apiUrl);
console.log("Configuración guardada en .env.local");
console.log("");
