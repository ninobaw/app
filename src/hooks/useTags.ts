import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive?: boolean;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTagData {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateTagData extends CreateTagData {
  isActive?: boolean;
}

// Hook pour récupérer tous les tags actifs (pour les utilisateurs normaux)
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const response = await api.get('/api/tags');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer tous les tags (actifs et inactifs) - SUPER_ADMIN uniquement
export const useAllTags = () => {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: async (): Promise<Tag[]> => {
      const response = await api.get('/api/tags/all');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook pour créer un nouveau tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData): Promise<Tag> => {
      console.log('useTags: Creating tag with data:', tagData);
      
      // Ajouter un timeout pour éviter les blocages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
      
      try {
        const response = await api.post('/api/tags', tagData, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('useTags: Tag creation response:', response.data);
        return response.data.data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('La création du tag a pris trop de temps. Veuillez réessayer.');
        }
        throw error;
      }
    },
    onSuccess: (newTag) => {
      console.log('useTags: Tag created successfully:', newTag);
      
      // Invalider et refetch les queries des tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      
      // Utiliser setTimeout pour éviter les conflits avec la fermeture du dialogue
      setTimeout(() => {
        toast.success(`Tag "${newTag.name}" créé avec succès`, {
          description: 'Le tag est maintenant disponible pour les correspondances',
        });
      }, 100);
    },
    onError: (error: any) => {
      console.error('useTags: Error creating tag:', error);
      const message = error.message || error.response?.data?.message || 'Erreur lors de la création du tag';
      toast.error('Erreur de création', {
        description: message,
      });
    },
    // Ajouter des options pour éviter les blocages
    retry: 1, // Réessayer une fois en cas d'échec
    retryDelay: 1000, // Attendre 1 seconde avant de réessayer
  });
};

// Hook pour modifier un tag
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...tagData }: UpdateTagData & { id: string }): Promise<Tag> => {
      const response = await api.put(`/api/tags/${id}`, tagData);
      return response.data.data;
    },
    onSuccess: (updatedTag) => {
      // Invalider et refetch les queries des tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      
      toast.success(`Tag "${updatedTag.name}" modifié avec succès`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du tag';
      toast.error('Erreur de modification', {
        description: message,
      });
    },
  });
};

// Hook pour supprimer définitivement un tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      await api.delete(`/api/tags/${tagId}`);
    },
    onSuccess: () => {
      // Invalider et refetch les queries des tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      
      toast.success('Tag supprimé définitivement', {
        description: 'Le tag a été supprimé de la base de données',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du tag';
      toast.error('Erreur de suppression', {
        description: message,
      });
    },
  });
};

// Hook pour activer/désactiver un tag
export const useToggleTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string): Promise<Tag> => {
      const response = await api.patch(`/api/tags/${tagId}/toggle`);
      return response.data.data;
    },
    onSuccess: (updatedTag) => {
      // Invalider et refetch les queries des tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      
      const action = updatedTag.isActive ? 'activé' : 'désactivé';
      toast.success(`Tag ${action} avec succès`, {
        description: `Le tag "${updatedTag.name}" a été ${action}`,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du tag';
      toast.error('Erreur de modification', {
        description: message,
      });
    },
  });
};

// Utilitaire pour obtenir les couleurs prédéfinies pour les tags
export const getTagColors = () => [
  { value: '#EF4444', label: 'Rouge', preview: 'bg-red-500' },
  { value: '#F97316', label: 'Orange', preview: 'bg-orange-500' },
  { value: '#EAB308', label: 'Jaune', preview: 'bg-yellow-500' },
  { value: '#22C55E', label: 'Vert', preview: 'bg-green-500' },
  { value: '#3B82F6', label: 'Bleu', preview: 'bg-blue-500' },
  { value: '#6366F1', label: 'Indigo', preview: 'bg-indigo-500' },
  { value: '#A855F7', label: 'Violet', preview: 'bg-purple-500' },
  { value: '#EC4899', label: 'Rose', preview: 'bg-pink-500' },
  { value: '#6B7280', label: 'Gris', preview: 'bg-gray-500' },
  { value: '#059669', label: 'Émeraude', preview: 'bg-emerald-600' },
];

// Utilitaire pour obtenir la couleur Tailwind CSS à partir d'une couleur hex
export const getTagColorClass = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#EF4444': 'bg-red-500',
    '#F97316': 'bg-orange-500',
    '#EAB308': 'bg-yellow-500',
    '#22C55E': 'bg-green-500',
    '#3B82F6': 'bg-blue-500',
    '#6366F1': 'bg-indigo-500',
    '#A855F7': 'bg-purple-500',
    '#EC4899': 'bg-pink-500',
    '#6B7280': 'bg-gray-500',
    '#059669': 'bg-emerald-600',
  };
  
  return colorMap[hexColor] || 'bg-blue-500';
};
