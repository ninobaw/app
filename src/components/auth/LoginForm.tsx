import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Plane, Loader2, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ForgotPasswordDialog } from './ForgotPasswordDialog'; 
import { CreateInitialAdminDialog } from '@/components/dialogs/CreateInitialAdminDialog';
import { useInitialSetup } from '@/hooks/useInitialSetup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WeakConnectionIndicator } from '@/components/ui/server-status';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isShaking, setIsShaking] = useState(false); 
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); 
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkInitialSetup } = useInitialSetup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs.',
        variant: 'destructive',
      });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    try {
      await login(email, password);
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue dans SGDO !',
        variant: 'success',
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur de connexion';
      
      toast({
        title: 'Erreur de connexion',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAdminCreated = () => {
    setNeedsInitialSetup(false);
    setIsCreateAdminDialogOpen(false);
    toast({
      title: 'Administrateur créé',
      description: 'Le super administrateur a été créé avec succès.',
      variant: 'success',
    });
  };

  useEffect(() => {
    setCheckingSetup(true);
    checkInitialSetup().then(setupStatus => {
      if (setupStatus) {
        setNeedsInitialSetup(setupStatus.needsInitialSetup);
      }
      setCheckingSetup(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aviation-sky to-blue-600 p-4">
      <WeakConnectionIndicator />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-aviation-sky rounded-full flex items-center justify-center">
              <Plane className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Connexion SGDO
          </CardTitle>
          <CardDescription className="text-gray-600">
            Système de Gestion des Documents d'Ordre
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {searchParams.get('error') && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {searchParams.get('error') === 'session_expired' 
                  ? 'Votre session a expiré. Veuillez vous reconnecter.' 
                  : 'Erreur de connexion. Veuillez réessayer.'}
              </span>
            </div>
          )}

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nom.prenom@tav.aero"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "pl-10",
                    isShaking && "animate-pulse border-red-500"
                  )}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "pl-10 pr-10",
                    isShaking && "animate-pulse border-red-500"
                  )}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-aviation-sky hover:bg-aviation-sky-dark" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Lien mot de passe oublié */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordDialogOpen(true)}
              className="text-aviation-sky hover:text-aviation-sky-dark text-sm font-medium hover:underline"
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton de création de super admin si nécessaire */}
          {needsInitialSetup && !checkingSetup && (
            <div className="text-center mt-4">
              <Button 
                type="button"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => setIsCreateAdminDialogOpen(true)}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                Créer Super Admin
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Aucun utilisateur trouvé. Créez le premier super administrateur.
              </p>
            </div>
          )}
          
          {/* Indicateur de chargement pendant la vérification */}
          {checkingSetup && (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Vérification de la configuration...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogues */}
      <ForgotPasswordDialog 
        open={isForgotPasswordDialogOpen} 
        onOpenChange={setIsForgotPasswordDialogOpen} 
      />

      <CreateInitialAdminDialog
        open={isCreateAdminDialogOpen}
        onOpenChange={setIsCreateAdminDialogOpen}
        onSuccess={handleAdminCreated}
      />
    </div>
  );
};
