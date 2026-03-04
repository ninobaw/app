import React from 'react';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { user, hasPermission, isLoading, refreshUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-aviation-sky"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Check if user must change password
  if (user.mustChangePassword) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Changement de mot de passe requis</h1>
            <p className="text-gray-600">Pour votre sécurité, vous devez changer votre mot de passe avant de continuer.</p>
          </div>
        </div>
        <ChangePasswordDialog
          isOpen={true}
          userId={user.id}
          onPasswordChanged={async () => {
            await refreshUser();
          }}
        />
      </>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};