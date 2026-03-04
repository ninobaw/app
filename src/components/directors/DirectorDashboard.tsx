import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  ArrowRight,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDirectorTasks } from '@/hooks/useCorrespondanceWorkflow';
import { UnifiedChatDialog } from './UnifiedChatDialog';
import { formatDate } from '@/shared/utils';

const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCorrespondanceId, setSelectedCorrespondanceId] = useState<string | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

  // Utiliser le hook de workflow pour récupérer les tâches réelles
  const { data: directorTasks, isLoading, error } = useDirectorTasks();

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'DIRECTEUR_GENERAL': 'Directeur Général',
      'DIRECTEUR': 'Directeur',
      'SOUS_DIRECTEUR': 'Sous-Directeur'
    };
    return roleNames[role] || role;
  };

  const getDashboardTitle = (role: string) => {
    if (role === 'DIRECTEUR_GENERAL') {
      return 'Dashboard Directeur Général';
    }
    return 'Dashboard Directeur';
  };

  const handleViewCorrespondances = () => {
    navigate('/correspondances');
  };

  const handleOpenConversation = (correspondanceId: string) => {
    setSelectedCorrespondanceId(correspondanceId);
    setWorkflowDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">Impossible de charger les données</p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculer les statistiques à partir des données réelles
  const allTasks = directorTasks?.tasks || [];
  
  // Séparer les tâches selon leur statut
  const pendingProposals = allTasks.filter(task => 
    task.workflowStatus === 'ASSIGNED_TO_DIRECTOR' || 
    task.workflowStatus === 'PENDING' ||
    !task.workflowStatus
  );
  
  const approvedProposals = allTasks.filter(task => 
    task.workflowStatus === 'DG_APPROVED' ||
    task.workflowStatus === 'RESPONSE_SENT'
  );
  
  const revisionRequests = allTasks.filter(task => 
    task.workflowStatus === 'DG_FEEDBACK' ||
    task.workflowStatus === 'DIRECTOR_REVISION'
  );
  
  const totalTasks = allTasks.length;
  const urgentTasks = allTasks.filter(task => task.priority === 'URGENT').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle(user?.role || '')}</h1>
          <p className="text-gray-600 flex items-center mt-2">
            <User className="w-4 h-4 mr-2" />
            {user?.firstName} {user?.lastName} - {getRoleDisplayName(user?.role || '')}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Mis à jour maintenant
        </Badge>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total des tâches</p>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Propositions en attente</p>
                <p className="text-2xl font-bold text-gray-900">{pendingProposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approuvées</p>
                <p className="text-2xl font-bold text-gray-900">{approvedProposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">{urgentTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleViewCorrespondances} className="h-12 justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Voir toutes les correspondances
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/correspondances?status=PENDING')} variant="outline" className="h-12 justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Correspondances en attente
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/correspondances?priority=URGENT')} variant="outline" className="h-12 justify-start">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Correspondances urgentes
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mes Propositions de Réponse */}
      {pendingProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Mes Propositions de Réponse ({pendingProposals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingProposals.slice(0, 5).map((task: any) => (
                <div key={task._id || task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title || task.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                        {task.priority || 'MEDIUM'}
                      </Badge>
                      <Badge variant="outline">
                        {task.workflowStatus || 'PENDING'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Créée le {formatDate(task.createdAt)}
                      </span>
                    </div>
                    
                    {/* Afficher les propositions existantes */}
                    {task.myDrafts && task.myDrafts.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600">
                          {task.myDrafts.length} proposition(s) créée(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenConversation(task._id || task.id)}
                    className="ml-4"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {task.myDrafts && task.myDrafts.length > 0 ? 'Modifier' : 'Créer proposition'}
                  </Button>
                </div>
              ))}
              {pendingProposals.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={handleViewCorrespondances}>
                    Voir toutes les propositions ({pendingProposals.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Révisions demandées */}
      {revisionRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              Révisions Demandées ({revisionRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revisionRequests.slice(0, 3).map((task: any) => (
                <div key={task._id || task.id} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title || task.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="destructive">Révision requise</Badge>
                      <Badge variant="outline">
                        {task.workflowStatus || 'DG_FEEDBACK'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Demandée le {formatDate(task.updatedAt)}
                      </span>
                    </div>
                    
                    {/* Afficher les feedbacks DG */}
                    {task.myDrafts && task.myDrafts.length > 0 && (
                      <div className="mt-2">
                        {task.myDrafts.map((draft: any, index: number) => (
                          draft.dgFeedbacks && draft.dgFeedbacks.length > 0 && (
                            <div key={index} className="text-xs text-orange-700 bg-orange-100 p-2 rounded mt-1">
                              <strong>Feedback DG:</strong> {draft.dgFeedbacks[draft.dgFeedbacks.length - 1].feedback}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenConversation(task._id || task.id)}
                    className="ml-4"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Réviser
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toutes les tâches si pas de catégorisation claire */}
      {totalTasks > 0 && pendingProposals.length === 0 && revisionRequests.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Toutes mes Correspondances ({allTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allTasks.map((task: any) => (
                <div key={task._id || task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title || task.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                        {task.priority || 'MEDIUM'}
                      </Badge>
                      <Badge variant="outline">
                        {task.workflowStatus || 'PENDING'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Créée le {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenConversation(task._id || task.id)}
                    className="ml-4"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucune tâche */}
      {totalTasks === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune tâche en attente</h3>
              <p className="text-gray-600 mb-4">Vous êtes à jour avec toutes vos correspondances !</p>
              <Button onClick={handleViewCorrespondances} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Voir toutes les correspondances
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de conversation unifié */}
      {selectedCorrespondanceId && (
        <UnifiedChatDialog
          correspondanceId={selectedCorrespondanceId}
          isOpen={workflowDialogOpen}
          onClose={() => {
            setWorkflowDialogOpen(false);
            setSelectedCorrespondanceId(null);
          }}
        />
      )}
    </div>
  );
};

export default DirectorDashboard;
