// Configuration pour différents environnements réseau
export interface NetworkEnvironment {
  name: string;
  description: string;
  hostPattern: string | RegExp;
  apiBaseUrl: string;
  frontendPort: number;
  backendPort: number;
}

export const NETWORK_ENVIRONMENTS: NetworkEnvironment[] = [
  {
    name: 'local-dev',
    description: 'Développement local',
    hostPattern: /^(localhost|127\.0\.0\.1)$/,
    apiBaseUrl: 'http://localhost:5000',
    frontendPort: 8080,
    backendPort: 5000
  },
  {
    name: 'office-network',
    description: 'Réseau bureau TAV (10.20.14.x)',
    hostPattern: /^10\.20\.14\.\d+$/,
    apiBaseUrl: 'auto', // Auto-détection basée sur l'IP
    frontendPort: 8080,
    backendPort: 5000
  },
  {
    name: 'corporate-network',
    description: 'Réseau d\'entreprise (192.168.x.x)',
    hostPattern: /^192\.168\.\d+\.\d+$/,
    apiBaseUrl: 'auto',
    frontendPort: 8080,
    backendPort: 5000
  },
  {
    name: 'production-domain',
    description: 'Domaine de production',
    hostPattern: /sgdo\.tavtunisie/,
    apiBaseUrl: 'https://sgdo.tavtunisie:5000',
    frontendPort: 443,
    backendPort: 5000
  },
  {
    name: 'any-ip-network',
    description: 'N\'importe quel réseau IP',
    hostPattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    apiBaseUrl: 'auto',
    frontendPort: 8080,
    backendPort: 5000
  }
];

export const detectNetworkEnvironment = (hostname: string): NetworkEnvironment | null => {
  for (const env of NETWORK_ENVIRONMENTS) {
    const pattern = typeof env.hostPattern === 'string' 
      ? new RegExp(env.hostPattern) 
      : env.hostPattern;
    
    if (pattern.test(hostname)) {
      console.log(`🌐 [Network] Environnement détecté: ${env.name} - ${env.description}`);
      return env;
    }
  }
  
  console.log('🌐 [Network] Aucun environnement spécifique détecté, utilisation du fallback');
  return null;
};

export const getApiUrlForEnvironment = (env: NetworkEnvironment, currentHost: string): string => {
  if (env.apiBaseUrl === 'auto') {
    const protocol = window.location.protocol;
    return `${protocol}//${currentHost}:${env.backendPort}`;
  }
  return env.apiBaseUrl;
};

export const getNetworkInfo = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const env = detectNetworkEnvironment(hostname);
  
  return {
    hostname,
    port,
    protocol,
    environment: env,
    apiUrl: env ? getApiUrlForEnvironment(env, hostname) : `${protocol}//${hostname}:5000`,
    isKnownNetwork: env !== null
  };
};
