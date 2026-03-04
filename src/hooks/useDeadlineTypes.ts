import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export interface DeadlineType {
  id: string;
  name: string;
  label: string;
  color: string;
  days: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeadlineTypeData {
  name: string;
  label: string;
  color?: string;
  days: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  isDefault?: boolean;
  order?: number;
}

export interface UpdateDeadlineTypeData extends Partial<CreateDeadlineTypeData> {
  isActive?: boolean;
}

// Hook pour récupérer tous les types d'échéance actifs
export const useDeadlineTypes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deadline-types'],
    queryFn: async (): Promise<DeadlineType[]> => {
      console.log('🔄 [useDeadlineTypes] Récupération des types d\'échéance');
      console.log('🔄 [useDeadlineTypes] URL:', '/api/deadline-types');
      
      try {
        const response = await api.get('/api/deadline-types');
        
        console.log('✅ [useDeadlineTypes] Réponse reçue:', response.status);
        console.log('✅ [useDeadlineTypes] Données:', response.data);
        console.log(`✅ [useDeadlineTypes] ${response.data.data?.length || 0} types récupérés`);
        
        return response.data.data || [];
      } catch (error: any) {
        console.error('❌ [useDeadlineTypes] Erreur:', error);
        console.error('❌ [useDeadlineTypes] Erreur détails:', error.response?.data);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour récupérer le type d'échéance par défaut
export const useDefaultDeadlineType = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deadline-types', 'default'],
    queryFn: async (): Promise<DeadlineType | null> => {
      console.log('🎯 [useDefaultDeadlineType] Récupération du type par défaut');
      
      try {
        const response = await api.get('/api/deadline-types/default');
        
        console.log(`✅ [useDefaultDeadlineType] Type par défaut: ${response.data.data?.name}`);
        
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('⚠️ [useDefaultDeadlineType] Aucun type par défaut configuré');
          return null;
        }
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour créer un nouveau type d'échéance (Admin seulement)
export const useCreateDeadlineType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeadlineTypeData): Promise<DeadlineType> => {
      console.log('➕ [useCreateDeadlineType] Création type:', data.name);
      
      const response = await api.post('/api/deadline-types', data);
      
      console.log(`✅ [useCreateDeadlineType] Type créé: ${response.data.data.name}`);
      
      return response.data.data;
    },
    onSuccess: () => {
      console.log('🔄 [useCreateDeadlineType] Invalidation du cache...');
      // Invalider tous les caches liés aux types d'échéance
      queryClient.invalidateQueries({ queryKey: ['deadline-types'] });
      queryClient.invalidateQueries({ queryKey: ['deadline-types', 'default'] });
      // Forcer le rechargement immédiat
      queryClient.refetchQueries({ queryKey: ['deadline-types'] });
    },
  });
};

// Hook pour mettre à jour un type d'échéance (Admin seulement)
export const useUpdateDeadlineType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDeadlineTypeData }): Promise<DeadlineType> => {
      console.log('📝 [useUpdateDeadlineType] Mise à jour type:', id);
      
      const response = await api.put(`/api/deadline-types/${id}`, data);
      
      console.log(`✅ [useUpdateDeadlineType] Type mis à jour: ${response.data.data.name}`);
      
      return response.data.data;
    },
    onSuccess: () => {
      console.log('🔄 [useUpdateDeadlineType] Invalidation du cache...');
      // Invalider tous les caches liés aux types d'échéance
      queryClient.invalidateQueries({ queryKey: ['deadline-types'] });
      queryClient.invalidateQueries({ queryKey: ['deadline-types', 'default'] });
      // Forcer le rechargement immédiat
      queryClient.refetchQueries({ queryKey: ['deadline-types'] });
    },
  });
};

// Hook pour supprimer un type d'échéance (Admin seulement)
export const useDeleteDeadlineType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ [useDeleteDeadlineType] Suppression type:', id);
      
      await api.delete(`/api/deadline-types/${id}`);
      
      console.log(`✅ [useDeleteDeadlineType] Type supprimé: ${id}`);
    },
    onSuccess: () => {
      console.log('🔄 [useDeleteDeadlineType] Invalidation du cache...');
      // Invalider tous les caches liés aux types d'échéance
      queryClient.invalidateQueries({ queryKey: ['deadline-types'] });
      queryClient.invalidateQueries({ queryKey: ['deadline-types', 'default'] });
      // Forcer le rechargement immédiat
      queryClient.refetchQueries({ queryKey: ['deadline-types'] });
    },
  });
};

// Fonction utilitaire pour calculer une échéance à partir d'un type
export const calculateDeadlineFromType = (deadlineType: DeadlineType, creationDate: Date = new Date()): Date => {
  const deadline = new Date(creationDate);
  deadline.setDate(deadline.getDate() + deadlineType.days);
  return deadline;
};

// Fonction utilitaire pour formater l'affichage d'un type d'échéance
export const formatDeadlineTypeDisplay = (deadlineType: DeadlineType): string => {
  return `${deadlineType.label} (${deadlineType.days}j)`;
};

// Fonction utilitaire pour obtenir la couleur CSS d'un type d'échéance
export const getDeadlineTypeColorClass = (deadlineType: DeadlineType): string => {
  // Convertir la couleur hex en classes Tailwind ou utiliser la couleur directement
  const colorMap: Record<string, string> = {
    '#DC2626': 'bg-red-600 text-white',
    '#EA580C': 'bg-orange-600 text-white',
    '#2563EB': 'bg-blue-600 text-white',
    '#059669': 'bg-green-600 text-white',
    '#7C3AED': 'bg-purple-600 text-white',
  };

  return colorMap[deadlineType.color] || 'bg-gray-600 text-white';
};
