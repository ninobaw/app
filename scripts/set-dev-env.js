import os from 'os';
import fs from 'fs';
import path from 'path';

const envFilePath = path.resolve(process.cwd(), '.env.development.local'); // Utiliser process.cwd() pour une meilleure compatibilité
const backendPort = 5000; // Assurez-vous que c'est le port sur lequel votre backend Express.js tourne

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      // Cherche une adresse IPv4 qui n'est pas interne (comme 127.0.0.1)
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost'; // Retourne 'localhost' si aucune adresse IP externe n'est trouvée
}

const ipAddress = getLocalIpAddress();
const envContent = `VITE_API_BASE_URL=http://${ipAddress}:${backendPort}\n`;

fs.writeFileSync(envFilePath, envContent);

console.log(`Génération de ${envFilePath} avec :`);
console.log(envContent);
console.log(`Le frontend tentera de se connecter au backend à http://${ipAddress}:${backendPort}`);