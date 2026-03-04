import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface TemporaryTokenData {
  email: string;
  tempPassword: string;
  userId: string;
  message: string;
}

export const TemporaryLinkHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [isValidating, setIsValidating] = useState(false);
  const [tokenData, setTokenData] = useState<TemporaryTokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'validating' | 'validated' | 'logging-in' | 'success' | 'error'>('validating');

  const token = searchParams.get('token');
  const isTemp = searchParams.get('temp') === 'true';

  useEffect(() => {
    if (token && isTemp) {
      validateTemporaryToken();
    } else {
      // Si pas de token temporaire, rediriger vers login normal
      navigate('/login');
    }
  }, [token, isTemp]);

  const validateTemporaryToken = async () => {
    if (!token) return;

    setIsValidating(true);
    setStep('validating');

    try {
      console.log('[TemporaryLinkHandler] Validation du token temporaire...');
      
      const response = await api.post('/api/temp-auth/validate-token', { token });
      
      if (response.data.success) {
        setTokenData(response.data.data);
        setStep('validated');
        
        toast({
          title: "Lien temporaire validé",
          description: "Connexion automatique en cours...",
          variant: "default"
        });

        // Attendre un peu pour que l'utilisateur voie le message
        setTimeout(() => {
          automaticLogin(response.data.data);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Token invalide');
      }

    } catch (error: any) {
      console.error('[TemporaryLinkHandler] Erreur validation token:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la validation du lien';
      setError(errorMessage);
      setStep('error');
      
      toast({
        title: "Lien temporaire invalide",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const automaticLogin = async (data: TemporaryTokenData) => {
    setStep('logging-in');

    try {
      console.log('[TemporaryLinkHandler] Connexion automatique pour:', data.email);
      
      // Stocker les informations temporaires pour le changement de mot de passe
      localStorage.setItem('tempPassword', data.tempPassword);
      localStorage.setItem('tempEmail', data.email);
      
      // Utiliser le service de connexion standard
      const success = await login(data.email, data.tempPassword);
      
      if (success) {
        setStep('success');
        
        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé vers le changement de mot de passe.",
          variant: "success"
        });

        // Nettoyer l'URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('Échec de la connexion automatique');
      }

    } catch (error: any) {
      console.error('[TemporaryLinkHandler] Erreur connexion automatique:', error);
      
      const errorMessage = error.message || 'Erreur lors de la connexion automatique';
      setError(errorMessage);
      setStep('error');
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRetryValidation = () => {
    setError(null);
    validateTemporaryToken();
  };

  const handleManualLogin = () => {
    // Nettoyer l'URL et rediriger vers login normal
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    navigate('/login');
  };

  const renderContent = () => {
    switch (step) {
      case 'validating':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">Validation du lien temporaire...</h3>
            <p className="text-gray-600">Vérification de la validité de votre lien d'accès sécurisé.</p>
          </div>
        );

      case 'validated':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-700">Lien validé avec succès !</h3>
            <p className="text-gray-600">Connexion automatique en cours pour {tokenData?.email}...</p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          </div>
        );

      case 'logging-in':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">Connexion en cours...</h3>
            <p className="text-gray-600">Authentification avec vos identifiants temporaires.</p>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Après connexion, vous devrez changer votre mot de passe temporaire.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-700">Connexion réussie !</h3>
            <p className="text-gray-600">Redirection vers votre espace de travail...</p>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Vous devrez changer votre mot de passe lors de cette première connexion.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-red-700">Problème avec le lien temporaire</h3>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-gray-600">Causes possibles :</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Le lien a expiré (durée de validité dépassée)</li>
                <li>• Le lien a déjà été utilisé</li>
                <li>• Le lien est malformé ou corrompu</li>
                <li>• Problème de connexion réseau</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleRetryValidation}
                variant="outline"
                disabled={isValidating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              
              <Button 
                onClick={handleManualLogin}
                variant="default"
              >
                Connexion manuelle
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Que faire ?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Contactez votre administrateur pour un nouveau lien</li>
                <li>• Vérifiez que vous utilisez le lien le plus récent</li>
                <li>• Essayez la connexion manuelle avec vos identifiants</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wallpaper bg-cover bg-center p-4 relative">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-aviation-sky-dark via-aviation-sky to-aviation-sky-dark opacity-20 animate-gradient-shift"
           style={{ backgroundSize: '200% 200%' }}></div>

      <Card className="w-full max-w-md shadow-xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès Sécurisé SGDO
          </CardTitle>
          <CardDescription>
            Traitement de votre lien temporaire
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};
