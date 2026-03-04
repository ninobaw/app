import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { API_ENDPOINTS } from '@/config/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  entity_id?: string; // New field: ID of the related entity
  entity_type?: 'USER' | 'DOCUMENT' | 'ACTION' | 'TASK' | 'CORRESPONDANCE' | 'PROCES_VERBAL' | 'REPORT' | 'SETTINGS'; // New field: Type of the related entity
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      const response = await axios.get(API_ENDPOINTS.notifications, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      // Handle the API response format: { success: true, data: [...] }
      return response.data.data || response.data as Notification[];
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await axios.put(`${API_ENDPOINTS.notifications}/${notificationId}`, { is_read: true }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // No toast here, as marking as read is a silent action
    },
    onError: (error: any) => {
      console.error('Erreur marquage notification:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de marquer la notification comme lue.',
        variant: 'destructive',
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      await axios.put(`${API_ENDPOINTS.notifications}/mark-all-read`, { userId: user.id }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Removed the toast for success here as per user request
    },
    onError: (error: any) => {
      console.error('Erreur marquage toutes notifications:', error); // Log the full error object
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de marquer toutes les notifications comme lues.',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead: markAsRead.mutate,
    isMarkingAsRead: markAsRead.isPending,
    markAllAsRead: markAllAsRead.mutate,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
};