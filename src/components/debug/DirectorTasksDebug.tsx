import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectorTasks } from '@/hooks/useCorrespondanceWorkflow';

export const DirectorTasksDebug: React.FC = () => {
  const { user } = useAuth();
  const { data: directorTasks, isLoading, error, refetch } = useDirectorTasks();

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Info className="w-5 h-5 mr-2" />
          Debug - Tâches Directeur
        </CardTitle>
        <CardDescription>
          Informations de diagnostic pour le dialogue de proposition de réponse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations utilisateur */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">👤 Utilisateur connecté:</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Nom:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Rôle:</strong> {user?.role}</p>
            <p><strong>Directorate:</strong> {(user as any)?.directorate || 'Non spécifié'}</p>
            <p><strong>ID:</strong> {user?.id}</p>
          </div>
        </div>

        {/* État du hook */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">🔄 État du hook useDirectorTasks:</h4>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant={isLoading ? 'secondary' : 'outline'}>
              {isLoading ? 'Chargement...' : 'Chargé'}
            </Badge>
            {error && <Badge variant="destructive">Erreur</Badge>}
            {!isLoading && !error && <Badge variant="default">Succès</Badge>}
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualiser
            </Button>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">
              <strong>Erreur:</strong> {error.message}
            </div>
          )}
        </div>

        {/* Données récupérées */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">📊 Données récupérées:</h4>
          {isLoading ? (
            <p className="text-gray-500">Chargement en cours...</p>
          ) : error ? (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Erreur lors du chargement des données
            </div>
          ) : directorTasks ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <span>Données chargées avec succès</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Nombre de tâches:</strong> {directorTasks.tasks?.length || 0}</p>
                <p><strong>Structure des données:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(directorTasks, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Aucune donnée récupérée
            </div>
          )}
        </div>

        {/* Instructions pour voir le dialogue */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium mb-2 text-yellow-800">💡 Comment voir le dialogue conversationnel:</h4>
          <ol className="text-sm space-y-1 text-yellow-700">
            <li>1. Assurez-vous d'être connecté avec un compte DIRECTEUR ou SOUS_DIRECTEUR</li>
            <li>2. Vérifiez que des correspondances vous sont assignées (champ personnesConcernees)</li>
            <li>3. Dans la section "Mes Propositions de Réponse", cliquez sur "Voir détails"</li>
            <li>4. Le dialogue conversationnel s'ouvrira avec l'interface de chat moderne</li>
            <li>5. Vous pourrez alors rédiger vos propositions et voir les feedbacks du DG</li>
          </ol>
        </div>

        {/* Actions de debug */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">🛠️ Actions de debug:</h4>
          <div className="space-y-2">
            <Button 
              onClick={() => console.log('User:', user)} 
              variant="outline" 
              size="sm"
            >
              Log User dans Console
            </Button>
            <Button 
              onClick={() => console.log('Director Tasks:', directorTasks)} 
              variant="outline" 
              size="sm"
            >
              Log Tasks dans Console
            </Button>
            <Button 
              onClick={() => {
                console.log('=== DEBUG DIRECTOR TASKS ===');
                console.log('User:', user);
                console.log('Tasks:', directorTasks);
                console.log('Loading:', isLoading);
                console.log('Error:', error);
              }} 
              variant="outline" 
              size="sm"
            >
              Log Complet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
