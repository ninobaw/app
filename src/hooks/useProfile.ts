import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios'; // Utiliser l'instance api configurée avec JWT
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { API_ENDPOINTS } from '@/config/api';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  position?: string;
  profilePhoto?: string; // This will now store the relative path
  airport: 'ENFIDHA' | 'MONASTIR' | 'GENERALE';
  role: 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'APPROVER' | 'USER' | 'VISITOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useProfile = () => {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth(); // Get refreshUser from AuthContext


  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('useProfile: user.id is missing, skipping fetch.');
        throw new Error('Utilisateur non connecté');
      }
      const response = await api.get(`${API_ENDPOINTS.users}/${user.id}`);
      // Ensure profilePhoto is stored as relative path, but returned as is from backend
      return response.data as ProfileData;
    },
    enabled: !!user?.id,
  });


  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'role' | 'airport' | 'isActive'>>) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      
      console.log(' [useProfile] Début de la mise à jour du profil');
      console.log(' [useProfile] Updates à envoyer:', updates);
      console.log(' [useProfile] User ID:', user.id);
      
      const response = await api.put(`${API_ENDPOINTS.users}/${user.id}`, updates);
      
      console.log(' [useProfile] Réponse du serveur:', response.data);
      
      return response.data;
    },
    onSuccess: async () => {
      console.log(' [useProfile] Mise à jour réussie, début du rafraîchissement');
      
      // First refresh user in AuthContext to update user state
      await refreshUser(); 
      console.log(' [useProfile] User rafraîchi dans AuthContext');
      
      // Then invalidate profile query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      console.log(' [useProfile] Profile query invalidée');
      
      toast({
        title: 'Profil mis à jour',
        description: 'Votre profil a été mis à jour avec succès.',
        variant: 'success', // Explicitly set to success
      });
      console.log(' [useProfile] Toast de succès affiché');
    },
    onError: (error: any) => {
      console.error(' [useProfile] Erreur mise à jour profil:', error.response?.data || error.message);
      console.error(' [useProfile] Détails de l\'erreur:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour le profil.',
        variant: 'destructive',
      });
    },
  });

  const changePassword = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      const response = await api.put(`${API_ENDPOINTS.users}/${user.id}/change-password`, { currentPassword, newPassword });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Mot de passe changé',
        description: 'Votre mot de passe a été changé avec succès.',
        variant: 'success', // Explicitly set to success
      });
    },
    onError: (error: any) => {
      console.error('useProfile: Erreur changement mot de passe:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de changer le mot de passe. Vérifiez votre mot de passe actuel.',
        variant: 'destructive',
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    changePassword: changePassword.mutate,
    isChangingPassword: changePassword.isPending,
  };
};