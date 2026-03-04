import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export const ForcePasswordChangeDialog: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // Effet pour pré-remplir le mot de passe temporaire
  useEffect(() => {
    const tempPassword = localStorage.getItem('tempPassword');
    const tempEmail = localStorage.getItem('tempEmail');
    
    if (tempPassword && tempEmail && user?.email === tempEmail) {
      setCurrentPassword(tempPassword);
      setIsAutoFilled(true);
      
      // Afficher un message informatif
      toast({
        title: "Mot de passe temporaire pré-rempli",
        description: "Votre mot de passe temporaire a été automatiquement saisi. Définissez maintenant votre nouveau mot de passe.",
        variant: "default"
      });
      
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('tempPassword');
      localStorage.removeItem('tempEmail');
    }
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (!currentPassword) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir votre mot de passe actuel.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
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
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit être différent de l\'ancien.',
        variant: 'destructive',
      });
      return;
    }

    setIsChanging(true);

    try {
      console.log(`[FORCE_PASSWORD_CHANGE] Tentative de changement pour utilisateur: ${user.id}`);
      console.log(`[FORCE_PASSWORD_CHANGE] Données:`, { currentPassword: '***', newPassword: '***' });
      
      const response = await api.put(`/api/users/${user.id}/change-password`, {
        currentPassword,
        newPassword,
      });

      console.log(`[FORCE_PASSWORD_CHANGE] Réponse API:`, response.data);

      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été modifié avec succès.',
        variant: 'success',
      });

      // Actualiser les données utilisateur pour mettre à jour mustChangePassword
      await refreshUser();
      
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error('[FORCE_PASSWORD_CHANGE] Erreur changement mot de passe:', error);
      console.error('[FORCE_PASSWORD_CHANGE] Détails erreur:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Messages d'erreur spécifiques
      let errorMessage = error.response?.data?.message || error.message || 'Impossible de modifier le mot de passe.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Le mot de passe actuel est incorrect.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Utilisateur non trouvé.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Données invalides.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
      
      toast({
        title: 'Erreur de changement de mot de passe',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChanging(false);
    }
  };

  // Le dialogue s'affiche automatiquement si mustChangePassword est true
  const isOpen = user?.mustChangePassword || false;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-500" />
            Changement de mot de passe obligatoire
          </DialogTitle>
          <DialogDescription>
            Votre mot de passe a été réinitialisé par un administrateur. 
            Vous devez définir un nouveau mot de passe pour continuer à utiliser l'application.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Action requise
              </p>
              <p className="text-sm text-orange-700">
                Pour des raisons de sécurité, vous devez changer votre mot de passe maintenant.
              </p>
            </div>
          </div>
        </div>

        {isAutoFilled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>✅ Mot de passe temporaire pré-rempli automatiquement</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Saisissez votre mot de passe actuel"
                className={isAutoFilled ? "border-green-300 bg-green-50" : ""}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={
                isChanging ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
            >
              {isChanging ? 'Modification en cours...' : 'Changer le mot de passe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
