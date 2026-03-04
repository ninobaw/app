import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ActionDecidee } from '@/components/actions/ActionsDecideesField';
import { Airport } from '@/shared/types'; // Import Airport type
import { API_ENDPOINTS } from '@/config/api';

export interface CorrespondanceData {
  id: string;
  _id?: string; // MongoDB ID field
  // Removed document_id as Correspondance is now standalone
  title: string; // Added directly
  author_id: string; // Added directly
  qr_code: string; // Added directly
  file_path?: string; // Added directly
  file_type?: string; // Added directly
  version: number; // Added directly
  views_count: number; // Added directly
  downloads_count: number; // Added directly

  type: 'INCOMING' | 'OUTGOING'; // New field
  code?: string; // New field
  from_address: string;
  to_address: string;
  subject: string;
  content: string;
  attachments: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'REPLIED' | 'INFORMATIF';
  airport: Airport; // Updated to use Airport type
  tags?: string[];
  actions_decidees?: ActionDecidee[];
  created_at: string;
  updated_at: string;
  deadline?: string;
  filePath?: string; // Alternative field name
  fileType?: string; // Alternative field name
  createdAt?: string; // Alternative field name
  updatedAt?: string; // Alternative field name
  date_correspondance?: string; // Date de la correspondance officielle
  // Nouveaux champs selon recommandations GM
  responseDate?: Date; // Date de la réponse
  informationTransmittedTo?: string; // Pour les correspondances INFORMATIF - à qui l'info a été transmise
  informationAcknowledged?: boolean; // Pour les correspondances INFORMATIF - si l'info a été prise en compte
  informationActions?: string; // Pour les correspondances INFORMATIF - actions prises
  departementsResponsables?: string[]; // Départements responsables de la correspondance
  
  // Champs pour les liaisons entre correspondances
  parentCorrespondanceId?: string; // ID de la correspondance parente
  originalCorrespondanceId?: string; // ID de la correspondance originale
  isResponse?: boolean; // Indique si c'est une réponse
  responseReference?: string; // Référence de la réponse

  author?: { // Author details now directly on CorrespondanceData
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

export const useCorrespondances = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['correspondances'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.correspondances, {
        params: {
          includeReplies: 'true', // Inclure les correspondances de réponse
          limit: 100 // Augmenter la limite pour récupérer toutes les correspondances
        }
      });
      console.log('🔄 [useCorrespondances] Raw API response:', response.data);
      // Vérifier si la réponse contient un objet avec une propriété data
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('✅ [useCorrespondances] Using response.data.data format, count:', response.data.data.length);
        
        // Debug: Afficher les types de correspondances
        const types = response.data.data.reduce((acc: any, corresp: any) => {
          acc[corresp.type] = (acc[corresp.type] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 [useCorrespondances] Types de correspondances:', types);
        
        // Debug: Lister les correspondances OUTGOING
        const outgoingCorrespondances = response.data.data.filter((c: any) => c.type === 'OUTGOING');
        if (outgoingCorrespondances.length > 0) {
          console.log('📤 [useCorrespondances] Correspondances OUTGOING trouvées:');
          outgoingCorrespondances.forEach((c: any, index: number) => {
            console.log(`   ${index + 1}. ${c.title || c.subject} (${c._id})`);
          });
        } else {
          console.log('❌ [useCorrespondances] Aucune correspondance OUTGOING dans la réponse');
        }
        
        return response.data.data as CorrespondanceData[];
      }
      // Si c'est déjà un tableau, le retourner directement
      if (Array.isArray(response.data)) {
        console.log('✅ [useCorrespondances] Using direct array format, count:', response.data.length);
        return response.data as CorrespondanceData[];
      }
      // Sinon, retourner un tableau vide
      console.warn('Format de réponse inattendu pour les correspondances:', response.data);
      return [] as CorrespondanceData[];
    },
    enabled: !!user,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.users);
      
      console.log('Raw users API response:', response.data);
      
      let allUsers = [];
      
      // Vérifier si la réponse contient un objet avec une propriété data
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Using response.data.data format for users, count:', response.data.data.length);
        allUsers = response.data.data;
      }
      // Si c'est déjà un tableau, le retourner directement
      else if (Array.isArray(response.data)) {
        console.log('Using direct array format for users, count:', response.data.length);
        allUsers = response.data;
      }
      // Si c'est un objet avec une propriété users
      else if (response.data && Array.isArray(response.data.users)) {
        console.log('Using response.data.users format, count:', response.data.users.length);
        allUsers = response.data.users;
      }
      else {
        console.warn('Unexpected users API response format:', response.data);
        return [];
      }
      
      // Filtrer les utilisateurs ayant accès aux correspondances
      const filteredUsers = allUsers.filter(user => {
        // Vérifier si l'utilisateur a le rôle approprié pour les correspondances
        const hasCorrespondanceAccess = 
          user.role === 'SUPER_ADMIN' || 
          user.role === 'ADMINISTRATOR' || 
          user.role === 'AGENT_BUREAU_ORDRE' ||
          (user.permissions && user.permissions.includes('correspondances')) ||
          (user.modules && user.modules.includes('correspondances'));
        
        return hasCorrespondanceAccess && user.isActive !== false;
      });
      
      console.log('Filtered users with correspondance access:', filteredUsers.length);
      return filteredUsers;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
  });

  const createCorrespondance = useMutation({
    mutationFn: async (data: {
      title: string;
      type: 'INCOMING' | 'OUTGOING';
      code?: string;
      from_address: string;
      to_address: string;
      subject: string;
      content: string;
      priority: CorrespondanceData['priority'];
      airport: Airport;
      attachments?: string[];
      actions_decidees?: ActionDecidee[];
      file_path?: string;
      file_type?: string;
      // Nouveaux champs pour le workflow de correspondance
      parentCorrespondanceId?: string;
      personnesConcernees?: string[];
      deposantInfo?: string;
      importanceSubject?: string;
      scannedDocumentPath?: string;
      responseReference?: string;
      responseDate?: string;
      informationTransmittedTo?: string;
      informationAcknowledged?: boolean;
      informationActions?: string;
      responseDeadline?: Date;
      tags?: string[];
      status?: 'PENDING' | 'REPLIED' | 'INFORMATIF';
      // Codification fields for generation
      company_code?: string;
      scope_code?: string;
      department_code?: string;
      sub_department_code?: string;
      language_code?: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const response = await api.post('/api/correspondances', {
        ...data,
        author_id: user.id, // Pass author_id to backend
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Invalider aussi le dashboard
      // No need to invalidate 'documents' anymore as correspondances are separate
    },
    onError: (error: any) => {
      console.error('Erreur création correspondance:', error.response?.data || error.message);
    },
  });

  const createCorrespondanceBatch = useMutation({
    mutationFn: async (data: { correspondances: any[], createdBy?: string }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      console.log(' Envoi des données batch:', data);
      
      const response = await api.post('/api/correspondances/batch', data);
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Invalider aussi le dashboard
      // Pas de notification ici - gérée par le composant avec la jauge
    },
    onError: (error: any) => {
      console.error('Erreur importation de correspondances en lot:', error.response?.data || error.message);
      // Pas de notification ici - gérée par le composant avec la jauge
    },
  });

  const updateCorrespondance = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorrespondanceData> & { id: string }) => {
      const response = await api.put(`${API_ENDPOINTS.correspondances}/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Invalider aussi le dashboard
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour correspondance:', error.response?.data || error.message);
    },
  });

  const deleteCorrespondance = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`${API_ENDPOINTS.correspondances}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Invalider aussi le dashboard
    },
    onError: (error: any) => {
      console.error('Erreur suppression correspondance:', error.response?.data || error.message);
    },
  });

  const clearAllCorrespondances = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`${API_ENDPOINTS.correspondances}/clear-all`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Invalider aussi le dashboard
    },
    onError: (error: any) => {
      console.error('Erreur suppression de toutes les correspondances:', error.response?.data || error.message);
    },
  });

  return {
    correspondances: data || [],
    isLoading,
    error,
    refetch,
    createCorrespondance: createCorrespondance.mutate,
    createCorrespondanceBatch: createCorrespondanceBatch.mutate,
    updateCorrespondance: updateCorrespondance.mutate,
    deleteCorrespondance: deleteCorrespondance, // Retourner l'objet mutation complet
    clearAllCorrespondances: clearAllCorrespondances.mutate,
    isCreating: createCorrespondance.isPending,
    isCreatingBatch: createCorrespondanceBatch.isPending,
    isUpdating: updateCorrespondance.isPending,
    isDeleting: deleteCorrespondance.isPending,
    isClearingAll: clearAllCorrespondances.isPending,
  };
};