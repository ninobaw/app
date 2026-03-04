import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { API_ENDPOINTS } from '@/config/api';

export interface DashboardStats {
  totalDocuments: number;
  activeUsers: number;
  completedActions: number;
  pendingActions: number;
  documentsThisMonth: number;
  averageCompletionTime: number;
  recentDocuments: any[];
  recentCorrespondences: any[];
  urgentActions: any[];
  activityLogs: any[];
  documentsCreatedMonthly: { name: string; count: number }[]; // New
  documentsByTypeStats: { name: string; value: number }[];    // New
  correspondencesCreatedMonthly: { name: string; count: number }[]; // New
  correspondencesByTypeStats: { name: string; value: number }[];    // New
  correspondencesByPriorityStats: { name: string; value: number }[]; // New
  correspondencesByStatusStats: { status: string; count: number; percentage: number }[]; // New
  // Nouvelles propriétés pour les agents de bureau d'ordre
  totalCorrespondences?: number;
  pendingCorrespondences?: number;
  repliedCorrespondences?: number;
  informativeCorrespondences?: number;
}

export interface DashboardActivity {
  id: string;
  type: 'document_created' | 'user_added' | 'action_completed' | 'action_overdue';
  title: string;
  description: string;
  user: {
    name: string;
    initials: string;
  };
  timestamp: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const useDashboard = () => {
  const { user } = useAuth(); // Get the current user from AuthContext

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, user?.role], // Include user ID and role in query key
    queryFn: async (): Promise<DashboardStats> => {
      try {
        if (!user?.id) {
          // If no user is logged in, return default empty stats
          return {
            totalDocuments: 0,
            activeUsers: 0,
            completedActions: 0,
            pendingActions: 0,
            documentsThisMonth: 0,
            averageCompletionTime: 0,
            recentDocuments: [],
            recentCorrespondences: [], // Nouvelle propriété pour les correspondances récentes
            urgentActions: [],
            activityLogs: [],
            documentsCreatedMonthly: [],
            documentsByTypeStats: [],
            correspondencesCreatedMonthly: [],
            correspondencesByTypeStats: [],
            correspondencesByPriorityStats: [],
            correspondencesByStatusStats: [],
          };
        }

        // Pass userId and userRole as query parameters
        const response = await axios.get(`${API_ENDPOINTS.dashboard}/stats`, {
          params: {
            userId: user.id,
            userRole: user.role,
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const dashboardData = response.data;

        return {
          totalDocuments: dashboardData.totalDocuments || 0,
          activeUsers: dashboardData.activeUsers || 0,
          completedActions: dashboardData.completedActions || 0,
          pendingActions: dashboardData.pendingActions || 0,
          documentsThisMonth: dashboardData.documentsThisMonth || 0,
          averageCompletionTime: dashboardData.averageCompletionTime || 0,
          recentDocuments: dashboardData.recentDocuments || [],
          recentCorrespondences: dashboardData.recentCorrespondences || [], // Nouvelle propriété pour les correspondances récentes
          urgentActions: dashboardData.urgentActions || [],
          activityLogs: dashboardData.activityLogs || [],
          documentsCreatedMonthly: dashboardData.documentsCreatedMonthly || [],
          documentsByTypeStats: dashboardData.documentsByTypeStats || [],
          correspondencesCreatedMonthly: dashboardData.correspondencesCreatedMonthly || [],
          correspondencesByTypeStats: dashboardData.correspondencesByTypeStats || [],
          correspondencesByPriorityStats: dashboardData.correspondencesByPriorityStats || [],
          correspondencesByStatusStats: dashboardData.correspondencesByStatusStats || [],
          // Nouvelles propriétés pour les agents de bureau d'ordre
          totalCorrespondences: dashboardData.totalCorrespondences,
          pendingCorrespondences: dashboardData.pendingCorrespondences,
          repliedCorrespondences: dashboardData.repliedCorrespondences,
          informativeCorrespondences: dashboardData.informativeCorrespondences,
        };
      } catch (error) {
        console.error('Erreur récupération stats dashboard:', error);
        return {
          totalDocuments: 0,
          activeUsers: 0,
          completedActions: 0,
          pendingActions: 0,
          documentsThisMonth: 0,
          averageCompletionTime: 0,
          recentDocuments: [],
          recentCorrespondences: [], // Nouvelle propriété pour les correspondances récentes
          urgentActions: [],
          activityLogs: [],
          documentsCreatedMonthly: [],
          documentsByTypeStats: [],
          correspondencesCreatedMonthly: [],
          correspondencesByTypeStats: [],
          correspondencesByPriorityStats: [],
          correspondencesByStatusStats: [],
        };
      }
    },
    enabled: !!user?.id && user?.role !== 'DIRECTEUR_GENERAL', // Désactiver pour le Directeur Général
    staleTime: 1000, // Réduire le cache
  });

  return {
    stats: stats || {
      totalDocuments: 0,
      activeUsers: 0,
      completedActions: 0,
      pendingActions: 0,
      documentsThisMonth: 0,
      averageCompletionTime: 0,
      recentDocuments: [],
      recentCorrespondences: [], // Nouvelle propriété pour les correspondances récentes
      urgentActions: [],
      activityLogs: [],
      documentsCreatedMonthly: [],
      documentsByTypeStats: [],
      correspondencesCreatedMonthly: [],
      correspondencesByTypeStats: [],
      correspondencesByPriorityStats: [],
      correspondencesByStatusStats: [],
    },
    isLoading: statsLoading,
  };
};