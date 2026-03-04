import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset'; // Import the new hook
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const { requestPasswordReset, isRequestingReset } = usePasswordReset();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer votre adresse email.',
        variant: 'destructive',
      });
      return;
    }

    requestPasswordReset(email, {
      onSuccess: () => {
        setEmail('');
        onOpenChange(false);
      },
      // onError is handled by the usePasswordReset hook's mutation
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Mot de passe oublié ?
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <div>
            <Label htmlFor="email">Adresse Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@sgdo.tn"
              required
              disabled={isRequestingReset}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isRequestingReset || !email.trim()}>
              {isRequestingReset ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};