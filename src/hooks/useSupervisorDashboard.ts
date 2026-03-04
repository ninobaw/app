import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/shared/types';

export interface SupervisorDashboardData {
  // Statistiques générales
  totalCorrespondances: number;
  pendingCorrespondances: number;
  repliedCorrespondances: number;
  overdueCorrespondances: number;
  responseRate: number;
  averageResponseTime: number;

  // Échéances et alertes
  criticalDeadlines: DeadlineAlert[];
  upcomingDeadlines: DeadlineAlert[];
  overdueItems: OverdueItem[];

  // Correspondances validées
  validatedForResponse: ValidatedCorrespondance[];
  
  // Statistiques par priorité
  priorityBreakdown: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };

  // Statistiques par aéroport
  airportStats: {
    airport: string;
    total: number;
    responded: number;
    pending: number;
    overdue: number;
    responseRate: number;
  }[];

  // Tendances temporelles
  weeklyTrends: {
    date: string;
    created: number;
    responded: number;
    overdue: number;
  }[];
}

export interface DeadlineAlert {
  id: string;
  correspondanceId: string;
  title: string;
  subject: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  airport: string;
  deadline: string;
  daysRemaining: number;
  hoursRemaining: number;
  status: 'CRITICAL' | 'WARNING' | 'INFO';
  assignedTo: string[];
  createdAt: string;
}

export interface OverdueItem {
  id: string;
  correspondanceId: string;
  title: string;
  priority: string;
  airport: string;
  deadline: string;
  daysOverdue: number;
  assignedTo: string[];
  lastReminderSent: string | null;
}

export interface ValidatedCorrespondance {
  id: string;
  correspondanceId: string;
  title: string;
  subject: string;
  priority: string;
  airport: string;
  validatedAt: string;
  validatedBy: string;
  directorComments: string;
  deadline: string;
  responseRequired: boolean;
  urgencyLevel: number;
}

export const useSupervisorDashboard = (timeframe: 'today' | 'week' | 'month' = 'week') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supervisor-dashboard', user?.id, timeframe],
    queryFn: async (): Promise<SupervisorDashboardData> => {
      console.log('🔄 useSupervisorDashboard - Début de la requête API');
      const startTime = Date.now();
      
      const response = await api.get('/api/supervisor/dashboard', {
        params: { timeframe },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      console.log(`✅ useSupervisorDashboard - Requête terminée en ${endTime - startTime}ms`);

      // Gestion des différents formats de réponse API
      if (response.data.success) {
        console.log('📊 useSupervisorDashboard - Données récupérées:', response.data.data);
        return response.data.data;
      } else if (response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    },
    enabled: !!user && user.role === UserRole.SUPERVISEUR_BUREAU_ORDRE,
    staleTime: 1 * 60 * 1000, // 1 minute - données plus dynamiques
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    refetchInterval: 3 * 60 * 1000, // Actualisation toutes les 3 minutes (plus fréquent)
    refetchOnWindowFocus: true, // Refetch au focus pour données à jour
    retry: 2, // Moins de tentatives pour éviter les délais
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Délais plus courts
  });
};

// Hook pour les paramètres d'échéances configurés par le super admin
export const useDeadlineSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deadline-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/deadline-parameters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data || response.data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - les paramètres changent rarement
  });
};

// Hook pour envoyer des rappels manuels
export const useSendReminder = () => {
  const { user } = useAuth();

  return {
    sendReminder: async (correspondanceId: string, userIds: string[], message: string) => {
      const response = await api.post('/supervisor/send-reminder', {
        correspondanceId,
        userIds,
        message
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    }
  };
};

// Hook pour marquer des correspondances comme en retard
export const useMarkOverdue = () => {
  return {
    markAsOverdue: async (correspondanceIds: string[], reason: string) => {
      const response = await api.post('/supervisor/mark-overdue', {
        correspondanceIds,
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    }
  };
};

// Hook pour générer des rapports personnalisés
export const useGenerateReport = () => {
  return {
    generateReport: async (params: {
      startDate: Date;
      endDate: Date;
      airports?: string[];
      priorities?: string[];
      includeStats?: boolean;
      format?: 'json' | 'excel' | 'pdf';
    }) => {
      const response = await api.post('/supervisor/generate-report', params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    }
  };
};
