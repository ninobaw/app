import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface ActivityLogData {
  id: string;
  action: string;
  details: Record<string, any> | string;
  entityId?: string;
  entityType?: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}

export const useActivityLogs = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchActivityLogs = async (): Promise<ActivityLogData[]> => {
    try {
      console.log('Fetching activity logs from:', `${API_BASE_URL}/api/activity-logs`);
      
      const response = await axios.get(`${API_BASE_URL}/api/activity-logs`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          limit: 100, // Limite par défaut
          sort: '-timestamp' // Plus récent en premier
        }
      });

      console.log('Activity logs response:', response);

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format - expected an array:', response.data);
        return [];
      }

      // Formater les données pour s'assurer qu'elles correspondent à l'interface
      return response.data.map((log: any) => {
        // Gérer le parsing sécurisé des détails
        let parsedDetails = log.details;
        if (typeof log.details === 'string') {
          try {
            parsedDetails = JSON.parse(log.details);
          } catch (e) {
            console.warn('Failed to parse log details:', e);
            parsedDetails = log.details;
          }
        }

        return {
          ...log,
          id: log._id || log.id,
          userId: log.userId?._id || log.userId,
          user: log.userId ? {
            firstName: log.userId.first_name || log.userId.firstName,
            lastName: log.userId.last_name || log.userId.lastName,
            email: log.userId.email
          } : undefined,
          details: parsedDetails,
          timestamp: log.timestamp || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching activity logs:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to fetch activity logs. Please try again later.');
    }
  };

  return useQuery<ActivityLogData[], Error>({
    queryKey: ['activityLogs'],
    queryFn: fetchActivityLogs,
    enabled: !!user,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};