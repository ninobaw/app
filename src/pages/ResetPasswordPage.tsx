import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isResettingPassword, verifyResetToken, isVerifyingResetToken } = usePasswordReset();
  const { toast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      
      // Vérifier la validité du token
      verifyResetToken(tokenFromUrl, {
        onSuccess: (data) => {
          console.log('Token verification result:', data);
          if (data.valid) {
            setTokenValid(true);
            setTimeRemaining(data.timeRemaining);
            toast({
              title: 'Lien valide',
              description: `Ce lien expire dans ${data.timeRemaining} minute(s).`,
              variant: 'success',
            });
          } else {
            setTokenValid(false);
            toast({
              title: 'Lien expiré',
              description: data.message || 'Ce lien de réinitialisation a expiré.',
              variant: 'destructive',
            });
          }
        },
        onError: (error: any) => {
          setTokenValid(false);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la vérification du lien.';
          toast({
            title: 'Lien invalide',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Jeton de réinitialisation manquant dans l\'URL.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [searchParams, navigate, toast, verifyResetToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Erreur',
        description: 'Jeton de réinitialisation invalide.',
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

    if (newPassword.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
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

    resetPassword({ token, newPassword }, {
      onSuccess: () => {
        toast({
          title: 'Mot de passe réinitialisé',
          description: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
          variant: 'success',
        });
        navigate('/login'); // Rediriger vers la page de connexion
      },
      onError: (error) => {
        // Le toast d'erreur est déjà géré par le hook usePasswordReset
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      },
    });
  };

  if (!token || isVerifyingResetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center p-8">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky mx-auto mb-4" />
          <p className="text-gray-600">Vérification du jeton...</p>
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
                {/* Cercle d'arrière-plan avec animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  {/* Icône d'horloge avec animation */}
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-red-400 rounded-full relative">
                      <div className="absolute top-1/2 left-1/2 w-1 h-6 bg-red-500 origin-bottom transform -translate-x-1/2 -translate-y-full animate-spin" 
                           style={{ animationDuration: '2s' }}></div>
                      <div className="absolute top-1/2 left-1/2 w-1 h-4 bg-red-400 origin-bottom transform -translate-x-1/2 -translate-y-full rotate-90"></div>
                    </div>
                    {/* Particules flottantes */}
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Effet de rayonnement */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-orange-300 rounded-full animate-ping opacity-30"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-red-300 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Titre principal */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 animate-fade-in">
                ⏰ Lien expiré
              </h1>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <span className="text-2xl">🚫</span>
                  <span className="font-semibold text-lg">Temps écoulé</span>
                </div>
                
                <p className="text-gray-700 text-base leading-relaxed">
                  Ce lien de réinitialisation de mot de passe a <strong>expiré</strong>.
                  <br />
                  Pour des raisons de sécurité, les liens ne sont valides que <strong>15 minutes</strong>.
                </p>
              </div>
            </div>

            {/* Actions */}
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
                <strong>"Mot de passe oublié ?"</strong> pour recevoir un nouveau lien.
              </p>
            </div>

            {/* Conseils de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <span className="text-lg">🛡️</span>
                <span className="font-medium">Conseil de sécurité</span>
              </div>
              <p className="text-sm text-blue-700">
                Les liens de réinitialisation expirent rapidement pour protéger votre compte contre les accès non autorisés.
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
            Réinitialiser votre mot de passe
          </CardTitle>
          <CardDescription>
            Entrez votre nouveau mot de passe.
            {timeRemaining !== null && (
              <div className="mt-2 text-orange-600 font-medium">
                ⏰ Ce lien expire dans {timeRemaining} minute(s)
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                disabled={isResettingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                required
                disabled={isResettingPassword}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-aviation-sky hover:bg-aviation-sky-dark"
              disabled={isResettingPassword || !newPassword || !confirmPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;