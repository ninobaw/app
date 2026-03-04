import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useUsers, UserData } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';

interface ResetPasswordDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetUserPassword, isResettingPassword } = useUsers();
  const { user: currentUser } = useAuth();

  // Vérifier que l'utilisateur connecté est SUPER_ADMIN
  const canResetPassword = currentUser?.role === 'SUPER_ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !canResetPassword) return;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    // Empêcher la modification du mot de passe d'un autre SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && user.id !== currentUser?.id) {
      alert('Impossible de modifier le mot de passe d\'un autre super administrateur.');
      return;
    }

    resetUserPassword(
      { userId: user.id, newPassword },
      {
        onSuccess: () => {
          setNewPassword('');
          setConfirmPassword('');
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  if (!canResetPassword) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Réinitialiser le mot de passe
          </DialogTitle>
          <DialogDescription>
            Réinitialiser le mot de passe de{' '}
            <span className="font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            . L'utilisateur devra changer son mot de passe lors de sa prochaine connexion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
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

          {user?.role === 'SUPER_ADMIN' && user.id !== currentUser?.id && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                ⚠️ Impossible de modifier le mot de passe d'un autre super administrateur.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isResettingPassword}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                isResettingPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                (user?.role === 'SUPER_ADMIN' && user.id !== currentUser?.id)
              }
            >
              {isResettingPassword ? 'Réinitialisation...' : 'Réinitialiser'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
