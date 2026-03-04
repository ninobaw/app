import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger'; // REMOVED

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Écouter explicitement sur toutes les interfaces
    port: 8080,
    strictPort: true, // Échouer si le port n'est pas disponible
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '10.20.14.130',
      'sgdo.tavtunisie',
      '.local', // Autoriser tous les domaines .local
      '.tav.aero' // Autoriser tous les sous-domaines tav.aero
    ]
  },
  define: {
    // Forcer la variable d'environnement au build time
    __VITE_API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://10.20.14.130:5000')
  },
  plugins: [
    // dyadComponentTagger(), // REMOVED
    react({
      jsxRuntime: 'automatic' // Explicitement défini le runtime JSX
    }),
    // La ligne componentTagger a été supprimée pour éviter toute interférence potentielle.
    // Ajout d'un commentaire pour forcer la re-détection de la configuration.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));