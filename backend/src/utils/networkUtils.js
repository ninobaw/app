const os = require('os');

/**
 * Obtient l'adresse IP locale du serveur
 * @returns {string} L'adresse IP locale (ex: 192.168.1.100)
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Parcourir toutes les interfaces réseau
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    
    for (const addr of addresses) {
      // Ignorer les adresses loopback (127.0.0.1) et IPv6
      // Chercher les adresses IPv4 non-internes
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  
  // Fallback si aucune adresse n'est trouvée
  return 'localhost';
}

/**
 * Obtient l'URL complète du frontend
 * @param {number} port - Port du frontend (par défaut 8080)
 * @returns {string} URL complète (ex: http://192.168.1.100:8080)
 */
function getFrontendURL(port = 8080) {
  // Si FRONTEND_BASE_URL est défini dans .env, l'utiliser
  if (process.env.FRONTEND_BASE_URL) {
    return process.env.FRONTEND_BASE_URL;
  }
  
  // Sinon, détecter automatiquement l'IP
  const ip = getLocalIPAddress();
  return `http://${ip}:${port}`;
}

/**
 * Obtient l'URL complète du backend
 * @param {number} port - Port du backend (par défaut 5000)
 * @returns {string} URL complète (ex: http://192.168.1.100:5000)
 */
function getBackendURL(port = 5000) {
  const ip = getLocalIPAddress();
  return `http://${ip}:${port}`;
}

module.exports = {
  getLocalIPAddress,
  getFrontendURL,
  getBackendURL
};
