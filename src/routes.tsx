import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentEditorPage } from '@/pages/DocumentEditorPage';
import { DocumentCreator } from '@/components/documents/DocumentCreator';
import { Button } from '@/components/ui/button';
import Dashboard from '@/pages/Dashboard';

// Types pour les rôles utilisateur (à déplacer dans un fichier de types partagé si nécessaire)
enum Role {
  VISITOR = 'VISITOR',
  USER = 'USER',
  APPROVER = 'APPROVER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Composant de page d'accueil temporaire
const HomePage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Bienvenue sur SGDO</h1>
      <p className="text-muted-foreground">Sélectionnez une option dans le menu de navigation</p>
    </div>
  </div>
);

// Composant de page de connexion temporaire
const LoginPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Connexion</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Veuillez vous connecter pour accéder à l'application
        </p>
      </div>
      <div className="mt-8 space-y-6">
        <Button className="w-full">
          Se connecter avec Microsoft 365
        </Button>
      </div>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout><HomePage /></AppLayout>,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: 'documents',
        children: [
          {
            path: 'new',
            element: <DocumentCreator />,
          },
          {
            path: ':documentId/edit',
            element: <DocumentEditorPage />,
          },
        ],
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
