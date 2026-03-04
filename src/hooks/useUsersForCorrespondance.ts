import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Airport } from '@/shared/types';
import { API_ENDPOINTS } from '@/config/api';

export interface UserForCorrespondance {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  airport: Airport;
  isActive: boolean;
}

/**
 * Hook optimisé pour charger uniquement les utilisateurs pertinents pour les correspondances
 * Filtre côté backend pour réduire la charge réseau et améliorer les performances
 */
export const useUsersForCorrespondance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['users-for-correspondance'],
    queryFn: async (): Promise<UserForCorrespondance[]> => {
      console.log('🔄 useUsersForCorrespondance - Début de la requête API');
      const startTime = Date.now();
      
      // Requête optimisée avec filtres côté backend
      const response = await api.get(`${API_ENDPOINTS.users}/for-correspondance`, {
        params: {
          // Filtrer seulement les utilisateurs actifs avec des rôles pertinents
          active: true,
          roles: [
            'SUPER_ADMIN',
            'ADMINISTRATOR', 
            'DIRECTEUR_GENERAL',
            'DIRECTEUR',
            'SOUS_DIRECTEUR',
            'AGENT_BUREAU_ORDRE',
            'SUPERVISEUR_BUREAU_ORDRE'
          ].join(','),
          // Limiter les champs retournés pour réduire la taille de la réponse
          fields: '_id,id,email,firstName,lastName,role,airport,isActive'
        }
      });

      const endTime = Date.now();
      console.log(`✅ useUsersForCorrespondance - Requête terminée en ${endTime - startTime}ms`);
      console.log(`📊 useUsersForCorrespondance - ${response.data?.length || 0} utilisateurs récupérés`);
      
      return response.data as UserForCorrespondance[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - les utilisateurs changent rarement
    gcTime: 15 * 60 * 1000, // 15 minutes en cache
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au mount si données en cache
    retry: 1, // Une seule tentative pour éviter les délais
    retryDelay: 1000, // Délai court
  });
};

/**
 * Hook pour obtenir seulement les utilisateurs actifs (version encore plus optimisée)
 */
export const useActiveUsersLight = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-users-light'],
    queryFn: async () => {
      console.log('🔄 useActiveUsersLight - Début de la requête API');
      const startTime = Date.now();
      
      const response = await api.get(`${API_ENDPOINTS.users}/active-light`, {
        params: {
          fields: '_id,email,firstName,lastName,role'
        }
      });

      const endTime = Date.now();
      console.log(`✅ useActiveUsersLight - Requête terminée en ${endTime - startTime}ms`);
      
      return response.data;
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
