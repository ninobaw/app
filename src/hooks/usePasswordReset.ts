import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

export const usePasswordReset = () => {
  const { toast } = useToast();

  const verifyResetToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await axios.get(`${API_ENDPOINTS.auth}/verify-reset-token/${tokenId}`);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Erreur vérification token ID:', error.response?.data || error.message);
    },
  });

  const validateResetToken = useMutation({
    mutationFn: async ({ tokenId, token }: { tokenId: string; token: string }) => {
      const response = await axios.post(`${API_ENDPOINTS.auth}/validate-reset-token`, { tokenId, token });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Erreur validation token:', error.response?.data || error.message);
    },
  });

  const requestPasswordReset = useMutation({
    mutationFn: async (email: string) => {
      const response = await axios.post(`${API_ENDPOINTS.auth}/forgot-password`, { email });
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.security?.tokenGenerated 
        ? 'Un lien de réinitialisation sécurisé a été envoyé à votre adresse email.'
        : 'Si un compte est associé à cette adresse email, un lien de réinitialisation a été envoyé.';
      
      toast({
        title: 'Lien de réinitialisation envoyé',
        description: message,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur demande réinitialisation mot de passe:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Impossible d\'envoyer le lien de réinitialisation.';
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: { tokenId: string; token: string; newPassword: string }) => {
      const response = await axios.post(`${API_ENDPOINTS.auth}/reset-password/${data.tokenId}`, { 
        token: data.token, 
        newPassword: data.newPassword 
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Mot de passe réinitialisé',
        description: 'Votre mot de passe a été réinitialisé avec succès en utilisant la nouvelle architecture sécurisée.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur réinitialisation mot de passe:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Le jeton de réinitialisation est invalide ou a expiré.';
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    requestPasswordReset: requestPasswordReset.mutate,
    isRequestingReset: requestPasswordReset.isPending,
    resetPassword: resetPassword.mutate,
    isResettingPassword: resetPassword.isPending,
    verifyResetToken: verifyResetToken.mutate,
    isVerifyingResetToken: verifyResetToken.isPending,
    validateResetToken: validateResetToken.mutate,
    isValidatingResetToken: validateResetToken.isPending,
  };
};