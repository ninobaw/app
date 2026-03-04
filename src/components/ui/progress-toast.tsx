import React from 'react';

interface ProgressToastProps {
  count: number;
}

export const ProgressToast: React.FC<ProgressToastProps> = ({ count }) => (
  <div className="space-y-3 progress-notification">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span>📤 Importation en cours...</span>
    </div>
    <p>Traitement de {count} correspondances...</p>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full progress-bar-animated w-full"></div>
    </div>
  </div>
);

interface SuccessToastProps {
  successCount: number;
  errorCount: number;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ successCount, errorCount }) => {
  const total = successCount + errorCount;
  const successRate = Math.round((successCount / total) * 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 success-notification">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
        <span>🎉 Importation terminée !</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">{successCount} correspondances créées</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">{errorCount} erreurs</span>
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out progress-bar-animated"
          style={{ width: `${successRate}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600 text-center">
        Taux de réussite: {successRate}%
      </div>
    </div>
  );
};

interface ErrorToastProps {
  message: string;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message }) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm">✕</span>
      </div>
      <span>❌ Erreur d'importation</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <p className="text-red-700 font-medium">L'importation a échoué</p>
    </div>
    <p className="text-sm text-red-600 bg-red-50 p-2 rounded border-l-2 border-red-300">
      {message}
    </p>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 h-3 rounded-full w-full progress-bar-animated"></div>
    </div>
  </div>
);
