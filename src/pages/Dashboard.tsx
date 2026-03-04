import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import DirectorDashboard from '@/components/directors/DirectorDashboard';
import { DirectorGeneralDashboard } from '@/components/directors/DirectorGeneralDashboard';
import { SupervisorDashboard } from '@/components/supervisor/SupervisorDashboard';
import { Dashboard as MainDashboard } from '@/components/dashboard/Dashboard';
import { UserRole } from '@/shared/types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Vérifier le rôle utilisateur pour afficher le bon dashboard
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  // Dashboard spécialisé pour le Directeur Général
  if (user.role === UserRole.DIRECTEUR_GENERAL) {
    return (
      <AppLayout>
        <DirectorGeneralDashboard />
      </AppLayout>
    );
  }

  // Dashboard pour les autres directeurs
  if (user.role === UserRole.DIRECTEUR || user.role === UserRole.SOUS_DIRECTEUR) {
    return (
      <AppLayout>
        <DirectorDashboard />
      </AppLayout>
    );
  }

  // Dashboard pour les superviseurs
  if (user.role === UserRole.SUPERVISEUR_BUREAU_ORDRE) {
    return (
      <AppLayout>
        <SupervisorDashboard />
      </AppLayout>
    );
  }

  // Dashboard principal pour tous les autres utilisateurs (SUPER_ADMIN, AGENT_BUREAU_ORDRE, etc.)
  return (
    <AppLayout>
      <MainDashboard />
    </AppLayout>
  );
};

export default DashboardPage;
