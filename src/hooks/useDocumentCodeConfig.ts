import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DocumentCodeConfig } from '@/shared/types';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

export const useDocumentCodeConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = ''; // Assuming token is defined somewhere in the code

  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ['document-code-config'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.documentCodeConfig);
      return response.data;
    },
    staleTime: Infinity, // Configuration data doesn't change often
    gcTime: Infinity, // Use gcTime instead of cacheTime for TanStack Query v5
  });

  const updateDocumentCodeConfig = useMutation({
    mutationFn: async (updatedConfig: DocumentCodeConfig) => {
      const response = await api.put(`${API_ENDPOINTS.documentCodeConfig}/${updatedConfig.id}`, updatedConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCodeConfig'] });
      toast({
        title: 'Configuration mise à jour',
        description: 'La configuration des codes documentaires a été mise à jour avec succès.',
        variant: 'success',
      });
    },
    onError: (err: any) => {
      console.error('Erreur mise à jour config codes documentaires:', err.response?.data || err.message);
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de mettre à jour la configuration des codes documentaires.',
        variant: 'destructive',
      });
    },
  });

  return {
    config,
    isLoading,
    error,
    updateDocumentCodeConfig: updateDocumentCodeConfig.mutate,
    isUpdating: updateDocumentCodeConfig.isPending,
  };
};