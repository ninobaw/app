import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/shared/types';

export interface DirectorGeneralMetrics {
  // Vue d'ensemble stratégique
  totalCorrespondances: number;
  correspondancesThisMonth: number;
  monthlyGrowth: number;
  
  // Workflow de traitement
  pendingApproval: number;
  awaitingResponse: number;
  completedThisWeek: number;
  overdueItems: number;
  
  // Performance organisationnelle
  averageResponseTime: number;
  responseRate: number;
  departmentPerformance: Array<{
    department: string;
    total: number;
    completed: number;
    responseRate: number;
    avgTime: number;
  }>;
  
  // Alertes stratégiques
  criticalCorrespondances: Array<{
    id: string;
    subject: string;
    from: string;
    priority: string;
    daysOverdue: number;
    assignedTo: string;
  }>;
  
  // Tendances et analyses
  weeklyTrends: Array<{
    week: string;
    incoming: number;
    processed: number;
    pending: number;
  }>;
  
  // Répartition par type et priorité
  typeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;

  // Métriques de leadership
  teamPerformance: {
    totalDirectors: number;
    activeDirectors: number;
    departmentCoverage: number;
  };

  // Indicateurs financiers (si applicable)
  budgetMetrics?: {
    totalBudget: number;
    usedBudget: number;
    pendingApprovals: number;
  };
}

export const useDirectorGeneralDashboard = (timeframe: 'week' | 'month' | 'quarter' = 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['director-general-dashboard', user?.id, timeframe],
    queryFn: async (): Promise<DirectorGeneralMetrics> => {
      const response = await api.get('/api/director-general/dashboard', {
        params: { timeframe }
      });

      // Gestion des différents formats de réponse API
      if (response.data.success) {
        return response.data.data;
      } else if (response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    },
    enabled: !!user && user.role === UserRole.DIRECTEUR_GENERAL,
    staleTime: 2 * 60 * 1000, // 2 minutes - données stratégiques plus fréquemment mises à jour
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchInterval: 5 * 60 * 1000, // Actualisation toutes les 5 minutes
    refetchOnWindowFocus: true, // Refetch au focus pour données à jour
    retry: 2, // Moins de tentatives pour éviter les délais
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Délais plus courts
  });
};

// Hook pour les actions rapides du DG
export const useDirectorGeneralActions = () => {
  const { user } = useAuth();

  const approveCorrespondance = async (correspondanceId: string, decision: 'approve' | 'reject', comments?: string) => {
    const response = await api.post(`/api/director-general/approve/${correspondanceId}`, {
      decision,
      comments
    });
    return response.data;
  };

  const getDepartmentReport = async (department: string, period: string) => {
    const response = await api.get(`/api/director-general/department-report`, {
      params: { department, period }
    });
    return response.data;
  };

  const getStrategicReport = async (type: 'monthly' | 'quarterly' | 'annual') => {
    const response = await api.get(`/api/director-general/strategic-report`, {
      params: { type }
    });
    return response.data;
  };

  const escalateCorrespondance = async (correspondanceId: string, targetDepartment: string, priority: string) => {
    const response = await api.post(`/api/director-general/escalate/${correspondanceId}`, {
      targetDepartment,
      priority
    });
    return response.data;
  };

  return {
    approveCorrespondance,
    getDepartmentReport,
    getStrategicReport,
    escalateCorrespondance,
    isEnabled: !!user && user.role === UserRole.DIRECTEUR_GENERAL
  };
};

// Hook pour les notifications stratégiques du DG
export const useDirectorGeneralNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['director-general-notifications', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/director-general/notifications');
      return response.data;
    },
    enabled: !!user && user.role === UserRole.DIRECTEUR_GENERAL,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Actualisation toutes les 2 minutes pour les notifications
  });
};
