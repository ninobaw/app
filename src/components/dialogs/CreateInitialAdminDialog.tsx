import React, { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, User, Mail, Lock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useInitialSetup, CreateInitialAdminData } from '@/hooks/useInitialSetup';

interface CreateInitialAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateInitialAdminDialog: React.FC<CreateInitialAdminDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { createInitialAdmin, loading, error } = useInitialSetup();
  const [formData, setFormData] = useState<CreateInitialAdminData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    airport: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.airport.trim()) {
      errors.airport = 'L\'aéroport est requis';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await createInitialAdmin(formData);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          airport: '',
        });
        setConfirmPassword('');
        setSuccess(false);
        setValidationErrors({});
      }, 2000);
    }
  };

  const handleInputChange = (field: keyof CreateInitialAdminData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setValidationErrors({});
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Configuration Initiale
          </DialogTitle>
          <DialogDescription>
            Créez le premier super administrateur pour initialiser le système.
            Cette option n'est disponible que si aucun utilisateur n'existe.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Super administrateur créé avec succès ! Vous pouvez maintenant vous connecter.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Prénom"
                  disabled={loading}
                  className={validationErrors.firstName ? 'border-red-500' : ''}
                />
                {validationErrors.firstName && (
                  <p className="text-sm text-red-500">{validationErrors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Nom"
                  disabled={loading}
                  className={validationErrors.lastName ? 'border-red-500' : ''}
                />
                {validationErrors.lastName && (
                  <p className="text-sm text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="airport" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Aéroport
              </Label>
              <Input
                id="airport"
                type="text"
                value={formData.airport}
                onChange={(e) => handleInputChange('airport', e.target.value)}
                placeholder="Ex: Enfidha-Hammamet"
                disabled={loading}
                className={validationErrors.airport ? 'border-red-500' : ''}
              />
              {validationErrors.airport && (
                <p className="text-sm text-red-500">{validationErrors.airport}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Minimum 6 caractères"
                disabled={loading}
                className={validationErrors.password ? 'border-red-500' : ''}
              />
              {validationErrors.password && (
                <p className="text-sm text-red-500">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Confirmer le mot de passe"
                disabled={loading}
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Créer Super Admin
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
