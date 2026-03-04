import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

export interface InitialSetupStatus {
  hasUsers: boolean;
  userCount: number;
  needsInitialSetup: boolean;
}

export interface CreateInitialAdminData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  airport: string;
}

export interface CreateInitialAdminResponse {
  message: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    airport: string;
    isActive: boolean;
    createdAt: string;
  };
  success: boolean;
}

export const useInitialSetup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInitialSetup = useCallback(async (): Promise<InitialSetupStatus | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.auth}/check-initial-setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de la configuration initiale');
      }

      const data: InitialSetupStatus = await response.json();
      console.log('[InitialSetup] Status:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('[InitialSetup] Error checking setup:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInitialAdmin = useCallback(async (adminData: CreateInitialAdminData): Promise<CreateInitialAdminResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[InitialSetup] Creating initial admin:', { ...adminData, password: '[HIDDEN]' });

      const response = await fetch(`${API_ENDPOINTS.auth}/create-initial-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du super administrateur');
      }

      console.log('[InitialSetup] Admin created successfully:', data.admin);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('[InitialSetup] Error creating admin:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    checkInitialSetup,
    createInitialAdmin,
  };
};
