import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Eye, EyeOff, Shield, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WeakConnectionIndicator } from '@/components/ui/server-status';

const SecureResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isResettingPassword, verifyResetToken, isVerifyingResetToken } = usePasswordReset();
  const { toast } = useToast();

  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attempts, setAttempts] = useState<number>(0);

  useEffect(() => {
    const tokenIdFromUrl = searchParams.get('tokenId');
    if (tokenIdFromUrl) {
      setTokenId(tokenIdFromUrl);
      
      // Vérifier le token ID d'abord
      verifyResetToken(tokenIdFromUrl, {
        onSuccess: (data) => {
          console.log('Token ID verification result:', data);
          if (data.valid) {
            setTokenValid(true);
            setTimeRemaining(data.timeRemaining);
            setAttempts(data.security?.attempts || 0);
            toast({
              title: 'Lien valide',
              description: `Ce lien expire dans ${data.timeRemaining} minute(s).`,
              variant: 'success',
            });
          } else {
            setTokenValid(false);
            const errorMessage = data.message || 'Ce lien de réinitialisation est invalide ou a expiré.';
            
            // Messages d'erreur spécifiques selon le code
            if (data.code === 'TOO_MANY_ATTEMPTS') {
              toast({
                title: 'Trop de tentatives',
                description: 'Trop de tentatives de réinitialisation. Veuillez demander un nouveau lien.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Lien invalide',
                description: errorMessage,
                variant: 'destructive',
              });
            }
          }
        },
        onError: (error: any) => {
          setTokenValid(false);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la vérification du lien.';
          toast({
            title: 'Erreur de vérification',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Identifiant de réinitialisation manquant dans l\'URL.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [searchParams, navigate, toast, verifyResetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenId || !token) {
      toast({
        title: 'Erreur',
        description: 'Identifiant ou jeton de réinitialisation invalide.',
        variant: 'destructive',
      });
      return;
    }

    if (!tokenValid) {
      toast({
        title: 'Erreur',
        description: 'Jeton de réinitialisation invalide ou expiré.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les nouveaux mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    resetPassword({ tokenId, token, newPassword }, {
      onSuccess: () => {
        toast({
          title: 'Mot de passe réinitialisé',
          description: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
          variant: 'success',
        });
        navigate('/login');
      },
      onError: (error) => {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        // Le toast d'erreur est déjà géré par le hook usePasswordReset
      },
    });
  };

  if (!tokenId || isVerifyingResetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center p-8">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien sécurisé...</p>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wallpaper bg-cover bg-center p-4 relative">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-20 animate-gradient-shift"
             style={{ backgroundSize: '200% 200%' }}></div>

        <Card className="w-full max-w-lg shadow-2xl relative z-10 animate-bounce-in">
          <CardContent className="text-center p-12 space-y-6">
            {/* Animation d'expiration */}
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-red-400 rounded-full relative">
                      <div className="absolute top-1/2 left-1/2 w-1 h-6 bg-red-500 origin-bottom transform -translate-x-1/2 -translate-y-full animate-spin" 
                           style={{ animationDuration: '2s' }}></div>
                      <div className="absolute top-1/2 left-1/2 w-1 h-4 bg-red-400 origin-bottom transform -translate-x-1/2 -translate-y-full rotate-90"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 animate-fade-in">
                🔒 Lien sécurisé invalide
              </h1>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <span className="text-2xl">🚫</span>
                  <span className="font-semibold text-lg">Lien expiré ou invalide</span>
                </div>
                
                <p className="text-gray-700 text-base leading-relaxed">
                  Ce lien de réinitialisation sécurisée est <strong>invalide, expiré, ou a déjà été utilisé</strong>.
                  <br />
                  Pour des raisons de sécurité, les liens ne sont valides que <strong>10 minutes</strong> et ne peuvent être utilisés qu'une seule fois.
                </p>
                
                {attempts > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-yellow-700 text-sm">
                      <strong>Tentatives de vérification : {attempts}/3</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-aviation-sky to-aviation-sky-dark hover:from-aviation-sky-dark hover:to-aviation-sky text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <span className="mr-2">🔄</span>
                Demander un nouveau lien
              </Button>
              
              <p className="text-sm text-gray-500">
                Retournez à la page de connexion et cliquez sur <br />
                <strong>"Mot de passe oublié ?"</strong> pour recevoir un nouveau lien sécurisé.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <span className="text-lg">🛡️</span>
                <span className="font-medium">Sécurité améliorée</span>
              </div>
              <p className="text-sm text-blue-700">
                Les liens de réinitialisation utilisent maintenant une <strong>architecture sécurisée</strong> avec 
                double vérification et expiration automatique.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-wallpaper bg-cover bg-center p-4 relative">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-aviation-sky-dark via-aviation-sky to-aviation-sky-dark opacity-20 animate-gradient-shift"
           style={{ backgroundSize: '200% 200%' }}></div>

      <Card className="w-full max-w-md shadow-xl relative z-10 animate-bounce-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-aviation-sky p-3 rounded-full relative overflow-hidden">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            🔒 Réinitialisation sécurisée du mot de passe
          </CardTitle>
          <CardDescription>
            Entrez votre jeton de sécurité et votre nouveau mot de passe.
            {timeRemaining !== null && (
              <div className="mt-2 text-orange-600 font-medium flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Ce lien expire dans {timeRemaining} minute(s)</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Jeton de sécurité</Label>
              <Input
                id="token"
                type="text"
                placeholder="Entrez le jeton reçu par email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
                required
                disabled={isResettingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isResettingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isResettingPassword}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-aviation-sky hover:bg-aviation-sky-dark"
              disabled={isResettingPassword || !token || !newPassword || !confirmPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Réinitialiser le mot de passe
                </>
              )}
            </Button>
          </form>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Sécurité renforcée</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Double authentification (ID + jeton)</li>
              <li>• Expiration automatique (10 minutes)</li>
              <li>• Usage unique et invaliation immédiate</li>
              <li>• Protection contre les tentatives multiples</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureResetPasswordPage;
