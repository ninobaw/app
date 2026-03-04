import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ServerStatusContextType {
  isServerOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkServerStatus: () => Promise<void>;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within ServerStatusProvider');
  }
  return context;
};

interface ServerStatusProviderProps {
  children: ReactNode;
}

export const ServerStatusProvider: React.FC<ServerStatusProviderProps> = ({ children }) => {
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerStatus = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setLastChecked(new Date());

    try {
      // Tenter de contacter le serveur avec un endpoint léger
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
      });

      if (response.ok) {
        setIsServerOnline(true);
        console.log('✅ [ServerStatus] Serveur en ligne');
      } else {
        setIsServerOnline(false);
        console.log('❌ [ServerStatus] Serveur hors ligne (réponse non-OK)');
      }
    } catch (error) {
      setIsServerOnline(false);
      console.log('❌ [ServerStatus] Erreur de connexion au serveur:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Vérifier le statut au montage
    checkServerStatus();

    // Configurer une vérification périodique
    const interval = setInterval(checkServerStatus, 30000); // Toutes les 30 secondes

    // Vérifier lors du retour en ligne (focus sur la fenêtre)
    const handleOnline = () => {
      console.log('🌐 [ServerStatus] Retour en ligne détecté');
      setTimeout(checkServerStatus, 1000); // Attendre 1 seconde avant de vérifier
    };

    const handleFocus = () => {
      console.log('👁 [ServerStatus] Focus sur la fenêtre détecté');
      checkServerStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const value: ServerStatusContextType = {
    isServerOnline,
    isChecking,
    lastChecked,
    checkServerStatus
  };

  return (
    <ServerStatusContext.Provider value={value}>
      {children}
    </ServerStatusContext.Provider>
  );
};

interface MaintenanceOverlayProps {
  onRetry?: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ onRetry }) => {
  const { isServerOnline, isChecking, lastChecked, checkServerStatus } = useServerStatus();

  if (isServerOnline) {
    return null;
  }

  const formatLastChecked = () => {
    if (!lastChecked) return 'Jamais';
    
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200">
        {/* Icônes animés */}
        <div className="flex justify-center mb-6">
          {isChecking ? (
            <div className="relative">
              <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />
            </div>
          ) : (
            <div className="relative">
              <WifiOff className="w-16 h-16 text-red-500" />
              <div className="absolute -top-1 -right-1">
                <AlertTriangle className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Titre et message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isChecking ? 'Vérification en cours...' : 'Site en maintenance'}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {isChecking 
              ? 'Nous vérifions la connexion avec le serveur...'
              : 'Notre site est temporairement indisponible. Nos équipes travaillent pour rétablir le service dans les plus brefs délais.'
            }
          </p>

          {/* Informations détaillées */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Statut:</span>
              <span className={`font-semibold ${isChecking ? 'text-blue-600' : 'text-red-600'}`}>
                {isChecking ? 'Vérification...' : 'Hors ligne'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Dernière vérification:</span>
              <span className="text-gray-600">{formatLastChecked()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">URL du serveur:</span>
              <span className="text-gray-600 font-mono text-xs">
                {window.location.origin}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => checkServerStatus()}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Vérification...' : 'Vérifier maintenant'}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser la page
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Réessayer plus tard
            </button>
          )}
        </div>

        {/* Informations additionnelles */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>
              <strong>Que faire ?</strong>
            </p>
            <ul className="text-left space-y-1">
              <li>• Vérifiez votre connexion internet</li>
              <li>• Attendez quelques minutes avant de réessayer</li>
              <li>• Contactez le support technique si le problème persiste</li>
            </ul>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">
                <strong>Support technique:</strong><br />
                Email: support@tav.aero<br />
                Téléphone: +216 XX XXX XXX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de connexion faible (optionnel)
export const WeakConnectionIndicator: React.FC = () => {
  const { isServerOnline, isChecking } = useServerStatus();

  if (isServerOnline || isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Connexion perdue</span>
    </div>
  );
};

// Hook pour les composants qui ont besoin de savoir si le serveur est disponible
export const useServerAvailability = () => {
  const { isServerOnline, isChecking, checkServerStatus } = useServerStatus();
  
  const executeWithServerCheck = async (callback: () => void) => {
    if (!isServerOnline && !isChecking) {
      await checkServerStatus();
    }
    
    if (isServerOnline) {
      callback();
    }
  };

  return {
    isServerOnline,
    isChecking,
    canUseServer: isServerOnline && !isChecking,
    executeWithServerCheck,
    checkServerStatus
  };
};
