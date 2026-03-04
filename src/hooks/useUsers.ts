import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios'; // Utiliser l'instance api configurée avec JWT
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Airport } from '@/shared/types';
import { API_ENDPOINTS } from '@/config/api'; // Your custom Node.js backend URL

export interface UserData {
  _id: string; // MongoDB utilise _id
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  position?: string;
  profilePhoto?: string;
  airport: Airport;
  role: 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'AGENT' | 'AGENT_BUREAU_ORDRE' | 'SUPERVISEUR_BUREAU_ORDRE' | 'DIRECTEUR_GENERAL' | 'DIRECTEUR' | 'SOUS_DIRECTEUR' | 'APPROVER' | 'USER' | 'VISITOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  directorate?: string;
  managedDepartments?: string[];
  delegationLevel?: number;
}

export const useUsers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('🔄 useUsers - Début de la requête API');
      const startTime = Date.now();
      const response = await api.get(API_ENDPOINTS.users);
      const endTime = Date.now();
      console.log(`✅ useUsers - Requête terminée en ${endTime - startTime}ms`);
      console.log(`📊 useUsers - ${response.data?.length || 0} utilisateurs récupérés`);
      return response.data as UserData[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - les utilisateurs changent rarement
    gcTime: 10 * 60 * 1000, // 10 minutes en cache (remplace cacheTime)
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au mount si données en cache
  });

  const createUser = useMutation({
    mutationFn: async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
      position?: string;
      airport: Airport;
      role: UserRole;
      directorate?: string;
      managedDepartments?: string[];
      delegationLevel?: number;
      password?: string; // Optionnel - si non fourni, un mot de passe temporaire sera généré
    }) => {
      console.log('[FRONTEND] Création utilisateur - données envoyées:', userData);
      const response = await api.post(API_ENDPOINTS.users, userData);
      console.log('[FRONTEND] Création utilisateur - réponse reçue:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Ne pas afficher de toast ici car on va afficher le dialog de bienvenue
      console.log('✅ Utilisateur créé avec succès, données de bienvenue:', data.welcome);
    },
    onError: (error: any) => {
      console.error('Erreur création utilisateur:', error.response?.data || error.message);
      console.error('Détails de validation:', error.response?.data?.details);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de créer l\'utilisateur.',
        variant: 'destructive',
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UserData>) => {
      const response = await api.put(`${API_ENDPOINTS.users}/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilisateur mis à jour',
        description: 'L\'utilisateur a été mis à jour avec succès.',
        variant: 'success', // Explicitly set to success
      });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour utilisateur:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de mettre à jour l\'utilisateur.',
        variant: 'destructive',
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      // Changed from soft delete (isActive: false) to hard delete
      await api.delete(`${API_ENDPOINTS.users}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilisateur supprimé',
        description: 'L\'utilisateur a été supprimé définitivement.',
        variant: 'destructive', // Explicitly set to destructive for permanent delete
      });
    },
    onError: (error: any) => {
      console.error('Erreur suppression utilisateur:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de supprimer l\'utilisateur.',
        variant: 'destructive',
      });
    },
  });

  const resetUserPassword = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      console.log('[FRONTEND] Début réinitialisation mot de passe');
      console.log('[FRONTEND] User ID:', userId);
      console.log('[FRONTEND] Current user role:', user?.role);
      console.log('[FRONTEND] Current user email:', user?.email);
      console.log('[FRONTEND] New password provided:', !!newPassword);
      console.log('[FRONTEND] New password length:', newPassword?.length || 0);
      console.log('[FRONTEND] API endpoint:', `${API_ENDPOINTS.users}/${userId}/reset-password`);
      
      const response = await api.post(`${API_ENDPOINTS.users}/${userId}/reset-password`, {
        newPassword
      });
      
      console.log('[FRONTEND] Response received:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Mot de passe réinitialisé',
        description: data.message || 'Le mot de passe a été réinitialisé. L\'utilisateur devra le changer lors de sa prochaine connexion.',
      });
    },
    onError: (error: any) => {
      console.error('Erreur réinitialisation mot de passe:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de réinitialiser le mot de passe.',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUser.mutate,
    isCreating: createUser.isPending,
    updateUser: updateUser.mutate,
    isUpdating: updateUser.isPending,
    deleteUser: deleteUser.mutate,
    isDeleting: deleteUser.isPending,
    resetUserPassword: resetUserPassword.mutate,
    isResettingPassword: resetUserPassword.isPending,
  };
};