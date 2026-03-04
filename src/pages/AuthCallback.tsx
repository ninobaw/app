import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    // Vérifier que c'est bien pour le service de traduction
    if (state !== 'translation_service') {
      console.warn('État inattendu dans le callback OAuth:', state);
      return;
    }

    if (error) {
      // Erreur d'authentification
      console.error('Erreur OAuth:', error, errorDescription);
      
      // Envoyer l'erreur à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'COPILOT_AUTH_ERROR',
          error: errorDescription || error
        }, window.location.origin);
      }
      
      // Fermer la popup après un délai
      setTimeout(() => {
        window.close();
      }, 3000);
      
    } else if (code) {
      // Succès de l'authentification
      console.log('Code d\'autorisation reçu:', code);
      
      // Envoyer le code à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'COPILOT_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
      }
      
      // Fermer la popup après un délai
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } else {
      // Cas inattendu
      console.warn('Callback OAuth sans code ni erreur');
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'COPILOT_AUTH_ERROR',
          error: 'Réponse OAuth invalide'
        }, window.location.origin);
      }
      
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, []);

  // Déterminer l'état d'affichage
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {error ? (
              <>
                <AlertCircle className="w-6 h-6 text-red-500" />
                Erreur d'Authentification
              </>
            ) : code ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                Authentification Réussie
              </>
            ) : (
              <>
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                Traitement en cours...
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {error ? (
            <div>
              <p className="text-red-700 mb-2">
                Une erreur s'est produite lors de l'authentification :
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                {errorDescription || error}
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Cette fenêtre va se fermer automatiquement dans quelques secondes.
              </p>
            </div>
          ) : code ? (
            <div>
              <p className="text-green-700 mb-2">
                ✅ Authentification réussie !
              </p>
              <p className="text-sm text-gray-600">
                Vous êtes maintenant connecté à Microsoft Copilot.
                Cette fenêtre va se fermer automatiquement.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-blue-700 mb-2">
                Traitement de votre authentification...
              </p>
              <p className="text-sm text-gray-600">
                Veuillez patienter pendant que nous configurons votre connexion.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
