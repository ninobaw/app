import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export interface ResponseDraft {
  directorId: string;
  directorName: string;
  directorate: string;
  responseContent: string;
  attachments: string[];
  comments: string;
  isUrgent: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'REVISED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  dgFeedbacks?: DGFeedback[];
  revisionHistory?: RevisionHistory[];
}

export interface DGFeedback {
  dgId: string;
  dgName: string;
  action: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';
  feedback: string;
  revisionRequests: string[];
  isApproved: boolean;
  createdAt: string;
}

export interface RevisionHistory {
  revisionDate: string;
  revisionComments: string;
  previousContent: string;
}

export interface WorkflowStatus {
  correspondanceId: string;
  workflowStatus: string;
  responseDrafts: ResponseDraft[];
  finalResponse?: any;
  personnesConcernees: any[];
  timeline: TimelineItem[];
}

export interface TimelineItem {
  step: string;
  title: string;
  date: string;
  status: 'completed' | 'pending' | 'current';
}

export const useCorrespondanceWorkflow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Créer une proposition de réponse
  const createResponseDraft = useMutation({
    mutationFn: async (data: {
      correspondanceId: string;
      responseContent: string;
      attachments?: string[];
      comments?: string;
      isUrgent?: boolean;
    }) => {
      const response = await api.post('/api/correspondances/workflow/create-draft', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['director-tasks'] });
      toast({
        title: 'Proposition créée',
        description: 'Votre proposition de réponse a été créée et envoyée au Directeur Général',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la création de la proposition',
        variant: 'destructive'
      });
    }
  });

  // Réviser une proposition de réponse
  const reviseResponseDraft = useMutation({
    mutationFn: async (data: {
      correspondanceId: string;
      draftIndex: number;
      responseContent: string;
      attachments?: string[];
      revisionComments?: string;
    }) => {
      const { correspondanceId, draftIndex, ...revisionData } = data;
      const response = await api.put(
        `/api/correspondances/workflow/revise-draft/${correspondanceId}/${draftIndex}`,
        revisionData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['director-tasks'] });
      toast({
        title: 'Proposition révisée',
        description: 'Votre proposition révisée a été envoyée au Directeur Général',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la révision',
        variant: 'destructive'
      });
    }
  });

  // DG donne son feedback
  const provideDGFeedback = useMutation({
    mutationFn: async (data: {
      correspondanceId: string;
      draftIndex: number;
      action: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';
      feedback?: string;
      revisionRequests?: string[];
      attachments?: string[];
    }) => {
      const { correspondanceId, draftIndex, ...feedbackData } = data;
      const response = await api.post(
        `/api/correspondances/workflow/dg-feedback/${correspondanceId}/${draftIndex}`,
        feedbackData
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['dg-pending'] });
      
      const actionMessages = {
        'APPROVE': 'Proposition approuvée avec succès',
        'REQUEST_REVISION': 'Demande de révision envoyée au directeur',
        'REJECT': 'Proposition rejetée'
      };
      
      toast({
        title: 'Feedback envoyé',
        description: actionMessages[variables.action],
        variant: variables.action === 'APPROVE' ? 'default' : 'destructive'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de l\'envoi du feedback',
        variant: 'destructive'
      });
    }
  });

  // Finaliser la réponse (superviseur)
  const finalizeResponse = useMutation({
    mutationFn: async (data: {
      correspondanceId: string;
      finalResponseContent: string;
      attachments?: string[];
      sendMethod?: string;
    }) => {
      const { correspondanceId, ...finalData } = data;
      const response = await api.post(
        `/api/correspondances/workflow/finalize/${correspondanceId}`,
        finalData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-pending'] });
      toast({
        title: 'Réponse envoyée',
        description: 'La réponse finale a été envoyée avec succès',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de l\'envoi de la réponse',
        variant: 'destructive'
      });
    }
  });

  return {
    createResponseDraft,
    reviseResponseDraft,
    provideDGFeedback,
    finalizeResponse
  };
};

// Hook pour récupérer le statut du workflow
export const useWorkflowStatus = (correspondanceId: string) => {
  return useQuery({
    queryKey: ['workflow-status', correspondanceId],
    queryFn: async (): Promise<WorkflowStatus> => {
      const response = await api.get(`/api/correspondances/workflow/status/${correspondanceId}`);
      return response.data.data;
    },
    enabled: !!correspondanceId,
    staleTime: 30 * 1000, // 30 secondes
  });
};

// Hook pour les tâches du directeur
export const useDirectorTasks = () => {
  return useQuery({
    queryKey: ['director-tasks'],
    queryFn: async () => {
      const response = await api.get('/api/correspondances/workflow/my-tasks');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Actualiser toutes les 2 minutes
  });
};

// Hook pour les propositions en attente de révision par le DG
export const useDGPendingTasks = () => {
  return useQuery({
    queryKey: ['dg-pending'],
    queryFn: async () => {
      const response = await api.get('/api/correspondances/workflow/dg-pending');
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Actualiser chaque minute
  });
};

// Hook pour les tâches du superviseur
export const useSupervisorPendingTasks = () => {
  return useQuery({
    queryKey: ['supervisor-pending'],
    queryFn: async () => {
      const response = await api.get('/api/correspondances/workflow/supervisor-pending');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Actualiser toutes les 2 minutes
  });
};

// Hook pour obtenir les directeurs par domaine
export const useDirectorsByDomain = () => {
  return useQuery({
    queryKey: ['directors-by-domain'],
    queryFn: async () => {
      const response = await api.get('/api/correspondances/workflow/directors-by-domain');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour corriger les assignations des correspondances existantes
export const useFixAssignments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/correspondances/workflow/fix-assignments');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['director-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['directors'] });
      
      toast({
        title: 'Assignations corrigées',
        description: data.message,
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la correction des assignations',
        variant: 'destructive'
      });
    }
  });
};

// Hook pour corriger les références ObjectId invalides
export const useFixObjectIdReferences = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/correspondances/workflow/fix-objectid-references');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      queryClient.invalidateQueries({ queryKey: ['director-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['directors'] });
      
      toast({
        title: 'Références corrigées',
        description: data.message,
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la correction des références',
        variant: 'destructive'
      });
    }
  });
};

// Hook pour diagnostiquer l'historique des commentaires
export const useWorkflowHistoryDebug = (correspondanceId: string) => {
  return useQuery({
    queryKey: ['workflow-history-debug', correspondanceId],
    queryFn: async () => {
      const response = await api.get(`/api/correspondances/workflow/debug-history/${correspondanceId}`);
      return response.data.data;
    },
    enabled: !!correspondanceId,
    staleTime: 10 * 1000, // 10 secondes
  });
};

// Hook pour diagnostiquer toutes les propositions
export const useProposalsDebug = () => {
  return useQuery({
    queryKey: ['proposals-debug'],
    queryFn: async () => {
      const response = await api.get('/api/correspondances/workflow/debug-proposals');
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 secondes
  });
};
