import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ActionDecidee } from '@/components/actions/ActionsDecideesField';
import { Airport } from '@/shared/types'; // Import Airport type

import { API_ENDPOINTS } from '@/config/api';

export interface ProcesVerbalData {
  id: string;
  // Removed document_id as ProcesVerbal is now standalone
  title: string; // Added directly
  author_id: string; // Added directly
  qr_code: string; // Added directly
  file_path?: string; // Added directly
  file_type?: string; // Added directly
  version: number; // Added directly
  views_count: number; // Added directly
  downloads_count: number; // Added directly

  meeting_date: string;
  participants: string[];
  agenda: string;
  decisions: string;
  location: string;
  meeting_type: string;
  airport: Airport; // Updated to use Airport type
  next_meeting_date?: string;
  actions_decidees?: ActionDecidee[];
  created_at: string;
  updated_at: string; // Added updated_at

  author?: { // Author details now directly on ProcesVerbalData
    first_name: string;
    last_name: string;
  };
  // Codification fields for generation
  company_code?: string;
  scope_code?: string;
  department_code?: string;
  sub_department_code?: string;
  language_code?: string;
  sequence_number?: number;
}

export const useProcesVerbaux = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: procesVerbaux = [], isLoading, error } = useQuery({
    queryKey: ['proces-verbaux'],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.documents}?type=PROCES_VERBAL`);
      return response.data as ProcesVerbalData[];
    },
    enabled: !!user,
  });

  const createProcesVerbal = useMutation({
    mutationFn: async (data: {
      title: string;
      meeting_date: string;
      participants: string[];
      agenda: string;
      decisions: string;
      location: string;
      meeting_type: string;
      airport: Airport; // Updated to use Airport type
      next_meeting_date?: string;
      actions_decidees?: ActionDecidee[];
      file_path?: string; // Added file_path
      file_type?: string; // Added file_type
      // Codification fields for generation
      company_code?: string;
      scope_code?: string;
      department_code?: string;
      sub_department_code?: string;
      language_code?: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const response = await axios.post(`${API_ENDPOINTS.documents}?type=PROCES_VERBAL`, {
        ...data,
        author_id: user.id, // Pass author_id to backend
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proces-verbaux'] });
      // No need to invalidate 'documents' anymore as PVs are separate
      toast({
        title: 'Procès-verbal créé',
        description: 'Le procès-verbal a été créé avec succès.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur création PV:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de créer le procès-verbal.',
        variant: 'destructive',
      });
    },
  });

  const updateProcesVerbal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcesVerbalData> & { id: string }) => {
      const response = await axios.put(`${API_ENDPOINTS.documents}?type=PROCES_VERBAL/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proces-verbaux'] });
      toast({
        title: 'Procès-verbal mis à jour',
        description: 'Le procès-verbal a été mis à jour avec succès.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour PV:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de mettre à jour le procès-verbal.',
        variant: 'destructive',
      });
    },
  });

  const deleteProcesVerbal = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_ENDPOINTS.documents}?type=PROCES_VERBAL/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proces-verbaux'] });
      toast({
        title: 'Procès-verbal supprimé',
        description: 'Le procès-verbal a été supprimé avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      console.error('Erreur suppression PV:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de supprimer le procès-verbal.',
        variant: 'destructive',
      });
    },
  });

  return {
    procesVerbaux,
    isLoading,
    error,
    createProcesVerbal: createProcesVerbal.mutate,
    updateProcesVerbal: updateProcesVerbal.mutate,
    deleteProcesVerbal: deleteProcesVerbal.mutate,
    isCreating: createProcesVerbal.isPending,
    isUpdating: updateProcesVerbal.isPending,
    isDeleting: deleteProcesVerbal.isPending,
  };
};