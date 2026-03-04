import { getNetworkInfo } from './network-environments';

// Configuration API universelle - Détection automatique multi-réseau
const getUniversalApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  console.log('🌐 [API Config] === DÉTECTION RÉSEAU UNIVERSELLE ===');
  
  // Utiliser la détection avancée d'environnement réseau
  const networkInfo = getNetworkInfo();
  
  console.log('🌐 [API Config] Informations réseau:', {
    hostname: networkInfo.hostname,
    port: networkInfo.port,
    protocol: networkInfo.protocol,
    environment: networkInfo.environment?.name || 'inconnu',
    isKnownNetwork: networkInfo.isKnownNetwork
  });
  
  // 1. Si un environnement réseau spécifique est détecté
  if (networkInfo.isKnownNetwork && networkInfo.environment) {
    console.log(`🔧 [API Config] MODE: ${networkInfo.environment.description}`);
    console.log('🔧 [API Config] URL API détectée ->', networkInfo.apiUrl);
    return networkInfo.apiUrl;
  }
  
  // 2. DÉVELOPPEMENT LOCAL (localhost/127.0.0.1)
  if (networkInfo.hostname === 'localhost' || networkInfo.hostname === '127.0.0.1') {
    console.log('🔧 [API Config] MODE: Développement local (fallback)');
    return 'http://localhost:5000';
  }
  
  // 3. ADRESSE IP RÉSEAU (détection automatique générique)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(networkInfo.hostname)) {
    const apiUrl = `http://${networkInfo.hostname}:5000`;
    console.log('🔧 [API Config] MODE: Réseau IP générique ->', apiUrl);
    return apiUrl;
  }
  
  // 4. DOMAINE PERSONNALISÉ
  if (networkInfo.hostname.includes('.')) {
    // Essayer d'abord la variable d'environnement si elle existe et n'est pas localhost
    if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
      console.log('🔧 [API Config] MODE: Domaine avec env var ->', envApiUrl);
      return envApiUrl;
    }
    
    // Sinon, construire l'URL basée sur le domaine actuel
    const apiUrl = `${networkInfo.protocol}//${networkInfo.hostname}:5000`;
    console.log('🔧 [API Config] MODE: Domaine auto-détecté ->', apiUrl);
    return apiUrl;
  }
  
  // 5. FALLBACK SÉCURISÉ
  console.log('🔧 [API Config] MODE: Fallback sécurisé');
  
  // Essayer la variable d'environnement en dernier recours
  if (envApiUrl) {
    console.log('🔧 [API Config] FALLBACK: Variable environnement ->', envApiUrl);
    return envApiUrl;
  }
  
  // Fallback ultime: utiliser l'hôte actuel
  const fallbackUrl = `http://${networkInfo.hostname}:5000`;
  console.log('🔧 [API Config] FALLBACK: Hôte actuel ->', fallbackUrl);
  return fallbackUrl;
};

export const API_BASE_URL = getUniversalApiUrl();
console.log('🌐 [API Config] Current hostname:', window.location.hostname);
console.log('🌐 [API Config] Environment variable VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🌐 [API Config] Resolved API_BASE_URL:', API_BASE_URL);
console.log('🌐 [API Config] Full window.location:', window.location.href);
export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/api/auth`,
  documents: `${API_BASE_URL}/api/documents`,
  templates: `${API_BASE_URL}/api/templates`,
  users: `${API_BASE_URL}/api/users`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  settings: `${API_BASE_URL}/api/settings`,
  documentCodeConfig: `${API_BASE_URL}/api/document-code-config`,
  correspondances: `${API_BASE_URL}/api/correspondances`,
  actions: `${API_BASE_URL}/api/actions`,
  notifications: `${API_BASE_URL}/api/notifications`,
  reports: `${API_BASE_URL}/api/reports`,
  qrcodes: `${API_BASE_URL}/api/qrcodes`,
  onlyoffice: `${API_BASE_URL}/api/onlyoffice`,
  collabora: `${API_BASE_URL}/api/collabora`,
  uploads: `${API_BASE_URL}/uploads`
};

export default API_ENDPOINTS;
