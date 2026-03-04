import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Créer une instance d'axios avec une configuration de base
const api = axios.create({
  baseURL: API_BASE_URL, // Utiliser notre configuration dynamique
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

console.log('🔧 [Axios] Configuration avec baseURL:', API_BASE_URL);

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Construire l'URL complète correctement
    const fullUrl = config.url?.startsWith('http') 
      ? config.url 
      : (config.baseURL ? new URL(config.url || '', config.baseURL).toString() : config.url);
      
    console.log('🔧 [Axios] Request interceptor - baseURL:', config.baseURL);
    console.log('🔧 [Axios] Request interceptor - url:', config.url);
    console.log('🔧 [Axios] Request interceptor - full URL:', fullUrl);
    console.log('axios request interceptor: Making request to', fullUrl, 'with token:', token ? 'present' : 'missing');
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gestion des réponses d'erreur
api.interceptors.response.use(
  (response) => {
    console.log('axios response interceptor: Success response from', response.config?.url);
    return response;
  },
  (error) => {
    console.log('axios response interceptor: Error response from', error.config?.url, 'Status:', error.response?.status);
    // Gestion des erreurs 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      console.log('axios interceptor: 401 error detected on URL:', error.config?.url);
      console.log('axios interceptor: Error message:', error.response?.data?.message);
      
      // Handle token expiration by clearing cache and forcing re-login
      if (error.response?.data?.message === 'Token expiré') {
        console.log('axios interceptor: Token expired, clearing all auth data and forcing fresh login');
        
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        
        // Clear any cached data that might be stale
        localStorage.clear();
        
        // Force page reload to clear any cached state
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
