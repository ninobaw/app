import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { API_ENDPOINTS } from '@/config/api';

export interface ReportData {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  content?: Record<string, any>;
  status: string;
  frequency?: string;
  last_generated?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useReports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      const response = await axios.get(API_ENDPOINTS.reports);
      return response.data as ReportData[];
    },
    enabled: !!user?.id,
  });

  const createReport = useMutation({
    mutationFn: async (reportData: {
      name: string;
      type: string;
      config: Record<string, any>;
      frequency?: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const response = await axios.post(API_ENDPOINTS.reports, {
        ...reportData,
        created_by: user.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Rapport créé',
        description: 'Le rapport a été créé avec succès avec les données actuelles.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur création rapport:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de créer le rapport.',
        variant: 'destructive',
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`API_ENDPOINTS.reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Rapport supprimé',
        description: 'Le rapport a été supprimé avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      console.error('Erreur suppression rapport:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de supprimer le rapport.',
        variant: 'destructive',
      });
    },
  });

  return {
    reports,
    isLoading,
    error,
    createReport: createReport.mutate,
    isCreating: createReport.isPending,
    deleteReport: deleteReport.mutate,
    isDeleting: deleteReport.isPending,
  };
};