import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Import axios
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Airport } from '@/shared/types'; // Import Airport type
import { API_ENDPOINTS } from '@/config/api';

export interface DocumentData {
  id: string;
  title: string;
  type: 'FORMULAIRE_DOC' | 'QUALITE_DOC' | 'NOUVEAU_DOC' | 'GENERAL' | 'TEMPLATE'; // Removed CORRESPONDANCE and PROCES_VERBAL
  content?: string;
  author_id: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  airport: Airport; // Updated to use Airport type
  file_path?: string;
  file_type?: string;
  filePath?: string; // Add filePath property for compatibility
  fileType?: string; // Add fileType property for compatibility
  qr_code: string;
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
  // New codification fields
  company_code?: string;
  scope_code?: string;
  department_code?: string;
  sub_department_code?: string;
  document_type_code?: string;
  language_code?: string;
  sequence_number?: number;
  tags?: string[]; // Added tags field
  // Approval fields
  approved_by?: {
    first_name: string;
    last_name: string;
  };
  approved_at?: string;
}

export const useDocuments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery<DocumentData[], Error>({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('useDocuments: Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(API_ENDPOINTS.documents, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('useDocuments: Données brutes reçues du backend:', response.data);
      
      // Handle the API response format
      const result = response.data;
      return result.success ? result.data : (Array.isArray(result) ? result : []);
    },
    enabled: !!user,
  });

  const createDocument = useMutation({
    mutationFn: async (documentData: {
      title: string;
      type: 'FORMULAIRE_DOC' | 'QUALITE_DOC' | 'NOUVEAU_DOC' | 'GENERAL'; // Removed CORRESPONDANCE and PROCES_VERBAL
      content?: string;
      airport: Airport; // Updated to use Airport type
      file_path?: string;
      file_type?: string;
      // New codification fields
      company_code?: string;
      scope_code?: string;
      department_code?: string;
      sub_department_code?: string;
      document_type_code?: string;
      language_code?: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await axios.post(API_ENDPOINTS.documents, {
        ...documentData,
        author_id: user.id,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle backend response format {success: true, data: {...}}
      const result = response.data;
      return result.success ? result.data : result;
    },
    onSuccess: () => {
      console.log('useDocuments: Invalidation du cache pour la clé documents.'); // Log d'invalidation
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document créé',
        description: 'Le document a été créé avec succès.',
      });
    },
    onError: (error) => {
      console.error('Erreur création document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le document.',
        variant: 'destructive',
      });
    },
  });

  const createDocumentFromTemplate = useMutation({
    mutationFn: async (data: {
      templateId: string;
      title: string;
      description?: string;
      airport: Airport; // This is the enum value (ENFIDHA, MONASTIR, GENERALE)
      company_code: string;
      department_code: string;
      sub_department_code?: string;
      document_type_code: string;
      language_code: string;
      scope_code: string; // Add scope_code here
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Use the standard documents endpoint since /from-template doesn't exist
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await axios.post(API_ENDPOINTS.documents, {
        title: data.title,
        type: 'GENERAL', // Default type for template-based documents
        content: data.description || '',
        status: 'DRAFT',
        airport: data.airport,
        metadata: {
          templateId: data.templateId,
          company_code: data.company_code,
          department_code: data.department_code,
          sub_department_code: data.sub_department_code,
          document_type_code: data.document_type_code,
          language_code: data.language_code,
          scope_code: data.scope_code
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Handle backend response format {success: true, data: {...}}
      const result = response.data;
      return result.success ? result.data : result;
    },
    onSuccess: (newDocument) => {
      console.log('useDocuments: Invalidation du cache pour la clé documents (depuis modèle).'); // Log d'invalidation
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document créé à partir du modèle',
        description: `Le document "${newDocument.title}" a été créé et est prêt à être édité.`,
      });
    },
    onError: (error: any) => {
      console.error('Erreur création document depuis modèle:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || error.response?.data?.message || error.message || 'Impossible de créer le document à partir du modèle.',
        variant: 'destructive',
      });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      title?: string;
      type?: 'FORMULAIRE_DOC' | 'QUALITE_DOC' | 'NOUVEAU_DOC' | 'GENERAL' | 'TEMPLATE'; // Added TEMPLATE type for updates
      content?: string;
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      airport?: Airport; // Updated to use Airport type
      file_path?: string; // Allow updating file_path
      file_type?: string; // Allow updating file_type
      version?: number; // Allow updating version
      views_count?: number;
      downloads_count?: number;
      // New codification fields
      company_code?: string;
      scope_code?: string;
      department_code?: string;
      sub_department_code?: string;
      document_type_code?: string;
      language_code?: string;
      sequence_number?: number;
      tags?: string[]; // Include tags in updates
      approved_by_id?: string; // New field for approval
      updated_at?: string; // Allow updating updated_at
    }) => {
      const response = await axios.put(`${API_ENDPOINTS.documents}/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      console.log('useDocuments: Invalidation du cache pour la clé documents (mise à jour).'); // Log d'invalidation
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document mis à jour',
        description: 'Le document a été mis à jour avec succès.',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('Erreur mise à jour document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le document.',
        variant: 'destructive',
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_ENDPOINTS.documents}/${id}`);
    },
    onSuccess: () => {
      console.log('useDocuments: Invalidation du cache pour la clé documents (suppression).'); // Log d'invalidation
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error) => {
      console.error('Erreur suppression document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document.',
        variant: 'destructive',
      });
    },
  });

  return {
    documents,
    isLoading,
    error,
    createDocument: createDocument.mutate,
    createDocumentFromTemplate: createDocumentFromTemplate.mutate,
    updateDocument: updateDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    isCreating: createDocument.isPending || createDocumentFromTemplate.isPending, // Combine pending states
    isUpdating: updateDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
};