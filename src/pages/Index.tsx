
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { DirectorGeneralDashboard } from '@/components/directors/DirectorGeneralDashboard';
import DirectorDashboard from '@/components/directors/DirectorDashboard';
import { SupervisorDashboard } from '@/components/supervisor/SupervisorDashboard';
import { UserRole } from '@/shared/types';

const Index = () => {
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

  // Dashboard principal pour tous les autres utilisateurs
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};

export default Index;
