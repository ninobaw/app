import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { DocumentHistory } from '@/shared/types'; // Import DocumentHistory type

import { API_ENDPOINTS } from '@/config/api';

export const useDocumentHistory = (documentId: string) => {
  const { toast } = useToast();

  const { data: history = [], isLoading, error } = useQuery<DocumentHistory[], Error>({
    queryKey: ['documentHistory', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const response = await axios.get(`API_ENDPOINTS.documents/${documentId}/history`);
      return response.data as DocumentHistory[];
    },
    enabled: !!documentId, // Only fetch if documentId is provided
  });

  if (error) {
    console.error('Erreur récupération historique document:', error.message);
    toast({
      title: 'Erreur',
      description: 'Impossible de charger l\'historique du document.',
      variant: 'destructive',
    });
  }

  return {
    history,
    isLoading,
    error,
  };
};