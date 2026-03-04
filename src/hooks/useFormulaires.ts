import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Import axios
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Airport } from '@/shared/types'; // Import Airport type

// Define your backend API base URL
import { API_ENDPOINTS } from '@/config/api';

export interface FormulaireData {
  id: string;
  title: string;
  content: string; // This will store JSON string of code, category, description, instructions
  code?: string;
  airport: Airport; // Updated to use Airport type
  category?: string;
  description?: string;
  instructions?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

// Export alias for compatibility
export type FormulaireDoc = FormulaireData;

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
}

export const useFormulaires = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: formulaires = [], isLoading, error } = useQuery({
    queryKey: ['formulaires'],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.documents}?type=FORMULAIRE_DOC`);
      return response.data as FormulaireData[];
    },
    enabled: !!user,
  });

  const createFormulaire = useMutation({
    mutationFn: async (formulaireData: {
      title: string;
      content?: string;
      code?: string;
      airport: Airport; // Updated to use Airport type
      category?: string;
      description?: string;
      instructions?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Vous devez être connecté pour créer un formulaire');
      }

      
      const response = await axios.post(`${API_ENDPOINTS.documents}?type=FORMULAIRE_DOC`, {
        title: formulaireData.title,
        content: formulaireData.content, // This will be a JSON string
        code: formulaireData.code,
        airport: formulaireData.airport,
        category: formulaireData.category,
        description: formulaireData.description,
        instructions: formulaireData.instructions,
        author_id: user.id, // Pass author_id from frontend user
      });
      return response.data as FormulaireData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulaires'] });
      toast({
        title: 'Formulaire créé',
        description: 'Le formulaire a été créé avec succès.',
        variant: 'success', // Explicitly set to success
      });
    },
    onError: (error: any) => {
      console.error('Erreur création formulaire:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de créer le formulaire.',
        variant: 'destructive',
      });
    },
  });

  const updateFormulaire = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormulaireData> & { id: string }) => {
      // For formulaires, the 'content' field is a JSON string containing code, category, description, instructions.
      // We need to ensure it's correctly formatted if updated.
      const currentFormulaire = queryClient.getQueryData<FormulaireData[]>(['formulaires'])?.find(f => f.id === id);
      let updatedContent = updates.content;

      if (updates.code !== undefined || updates.category !== undefined || updates.description !== undefined || updates.instructions !== undefined) {
        const oldContent = currentFormulaire?.content ? JSON.parse(currentFormulaire.content) : {};
        updatedContent = JSON.stringify({
          code: updates.code !== undefined ? updates.code : oldContent.code,
          category: updates.category !== undefined ? updates.category : oldContent.category,
          description: updates.description !== undefined ? updates.description : oldContent.description,
          instructions: updates.instructions !== undefined ? updates.instructions : oldContent.instructions,
        });
      }

      const response = await axios.put(`${API_ENDPOINTS.documents}?type=FORMULAIRE_DOC/${id}`, {
        title: updates.title,
        airport: updates.airport,
        content: updatedContent,
        // Do not send code, category, description, instructions as separate fields if they are part of content
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulaires'] });
      toast({
        title: 'Formulaire mis à jour',
        description: 'Le formulaire a été mis à jour avec succès.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour formulaire:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de mettre à jour le formulaire.',
        variant: 'destructive',
      });
    },
  });

  const deleteFormulaire = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_ENDPOINTS.documents}?type=FORMULAIRE_DOC/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulaires'] });
      toast({
        title: 'Formulaire supprimé',
        description: 'Le formulaire a été supprimé avec succès.',
        variant: 'destructive', // Explicitly set to destructive
      });
    },
    onError: (error: any) => {
      console.error('Erreur suppression formulaire:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de supprimer le formulaire.',
        variant: 'destructive',
      });
    },
  });

  return {
    formulaires,
    isLoading,
    error,
    createFormulaire: createFormulaire.mutate,
    isCreating: createFormulaire.isPending,
    updateFormulaire: updateFormulaire.mutate, // Expose update mutation
    isUpdating: updateFormulaire.isPending, // Expose update pending state
    deleteFormulaire: deleteFormulaire.mutate,
    isDeleting: deleteFormulaire.isPending,
  };
};