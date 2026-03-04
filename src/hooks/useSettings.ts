import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Airport } from '@/shared/types'; // Import Airport type

import { API_ENDPOINTS } from '@/config/api';

export interface AppSettings {
  id?: string; // The ID of the single global settings document
  company_name: string;
  default_airport: Airport; // Updated to use Airport type
  language: string;
  theme: string;
  // Removed email_notifications, sms_notifications, push_notifications (now on User model)
  session_timeout: number;
  require_two_factor: boolean;
  password_expiry: number;
  document_retention: number;
  auto_archive: boolean;
  max_file_size: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  use_ssl: boolean;
  // Nouveaux champs pour la configuration SMS (Twilio)
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export const useSettings = () => {
  const { toast } = useToast();
  const { refreshUser } = useAuth(); // Import refreshUser from useAuth
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['globalSettings'], // Changed query key to reflect global settings
    queryFn: async () => {
      // No userId needed for fetching global settings
      const response = await axios.get(API_ENDPOINTS.settings, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }); // Fetch the single global settings document
      return response.data as AppSettings;
    },
    // This query should always be enabled as it fetches global settings
    // No dependency on user.id here, as it's global
  });

  const updateSettings = useMutation({
    mutationFn: async (settingsData: Partial<AppSettings>) => {
      // We need the ID of the global settings document to update it
      if (!settings?.id) throw new Error('Global settings document ID is missing.');


      const response = await axios.put(`${API_ENDPOINTS.settings}/${settings.id}`, settingsData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (data) => { // 'data' ici est la réponse du backend après la mise à jour
      queryClient.setQueryData(['globalSettings'], data); // Met à jour directement le cache avec les nouvelles données
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Vos paramètres ont été mis à jour avec succès.',
        variant: 'success',
      });
      // IMPORTANT: Refresh user data in AuthContext to apply session timeout changes immediately
      refreshUser(); 
    },
    onError: (error: any) => {
      console.error('Erreur sauvegarde paramètres globaux:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};