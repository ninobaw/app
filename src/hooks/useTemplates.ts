import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Airport } from '@/shared/types';
import { API_ENDPOINTS } from '@/config/api';

export interface TemplateData {
  id: string;
  title: string;
  type: 'FORMULAIRE_DOC' | 'CORRESPONDANCE' | 'PROCES_VERBAL' | 'QUALITE_DOC' | 'NOUVEAU_DOC' | 'GENERAL' | 'TEMPLATE';
  content?: string; // Can be used for template description
  author_id: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  airport: Airport;
  file_path?: string; // Relative path to the template file
  file_type?: string;
  qr_code: string; // Templates also have QR codes for identification
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  isTemplate: boolean; // Key field to identify templates
  author?: {
    first_name: string;
    last_name: string;
  };
  document_type_code?: string; // Added document_type_code to TemplateData
}

export const useTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Templates API: Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Fetch documents that are marked as templates
      const response = await axios.get(`${API_ENDPOINTS.documents}?isTemplate=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Handle the API response format
      const result = response.data;
      console.log('Templates API response:', result);
      return result.success ? result.data : (Array.isArray(result) ? result : []);
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: {
      title: string;
      content?: string;
      airport: Airport;
      file_path: string; // Path to the uploaded template file
      file_type: string;
      // New codification fields
      company_code: string;
      scope_code: string;
      department_code: string;
      sub_department_code?: string;
      document_type_code: string;
      language_code: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Templates are created as documents with type 'TEMPLATE' and isTemplate: true
      const response = await axios.post(API_ENDPOINTS.documents, {
        ...templateData,
        author_id: user.id,
        type: 'TEMPLATE', // Specific type for templates
        isTemplate: true,
        version: 1,
        status: 'ACTIVE', // Templates are usually active
        qr_code: `QR-TEMPLATE-${Date.now()}`, // Generate a unique QR for the template (will be overwritten by backend)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Modèle créé',
        description: 'Le modèle de document a été créé avec succès.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur création modèle:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de créer le modèle.',
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_ENDPOINTS.documents}/${id}`); // Delete the document entry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Modèle supprimé',
        description: 'Le modèle de document a été supprimé avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      console.error('Erreur suppression modèle:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de supprimer le modèle.',
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplate.mutate,
    isCreating: createTemplate.isPending,
    deleteTemplate: deleteTemplate.mutate,
    isDeleting: deleteTemplate.isPending,
  };
};