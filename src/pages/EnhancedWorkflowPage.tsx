import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import EnhancedWorkflowManager from '@/components/workflow/EnhancedWorkflowManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Workflow, FileText, Calendar, User, Users, Crown, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const EnhancedWorkflowPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
    }
  }, [workflowId]);

  const fetchWorkflow = async () => {
    if (!workflowId) return;

    try {
      const response = await api.get(`/api/enhanced-workflow/${workflowId}`);
      if (response.data.success) {
        setWorkflow(response.data.data);
      } else {
        toast({
          title: "Erreur",
          description: "Workflow non trouvé",
          variant: "destructive"
        });
        navigate('/correspondances');
      }
    } catch (error) {
      console.error('Erreur récupération workflow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le workflow",
        variant: "destructive"
      });
      navigate('/correspondances');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowUpdate = (updatedWorkflow: any) => {
    setWorkflow(updatedWorkflow);
  };

  const handleBackToCorrespondences = () => {
    navigate('/correspondances');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CREATED: 'bg-gray-100 text-gray-800',
      ASSIGNED_TO_DIRECTOR: 'bg-blue-100 text-blue-800',
      DIRECTOR_DRAFT: 'bg-yellow-100 text-yellow-800',
      DG_REVIEW: 'bg-purple-100 text-purple-800',
      DG_FEEDBACK: 'bg-orange-100 text-orange-800',
      DIRECTOR_REVISION: 'bg-amber-100 text-amber-800',
      DG_APPROVED: 'bg-green-100 text-green-800',
      SUPERVISOR_NOTIFIED: 'bg-cyan-100 text-cyan-800',
      RESPONSE_PREPARED: 'bg-indigo-100 text-indigo-800',
      RESPONSE_SENT: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CREATED: 'Créée',
      ASSIGNED_TO_DIRECTOR: 'Assignée au Directeur',
      DIRECTOR_DRAFT: 'Proposition en cours',
      DG_REVIEW: 'Révision DG',
      DG_FEEDBACK: 'Feedback DG',
      DIRECTOR_REVISION: 'Révision Directeur',
      DG_APPROVED: 'Approuvée DG',
      SUPERVISOR_NOTIFIED: 'Superviseur Notifié',
      RESPONSE_PREPARED: 'Réponse Préparée',
      RESPONSE_SENT: 'Envoyée'
    };
    return labels[status] || status;
  };

  const getProgressPercentage = (status: string) => {
    const statusOrder = [
      'CREATED',
      'ASSIGNED_TO_DIRECTOR',
      'DIRECTOR_DRAFT',
      'DG_REVIEW',
      'DG_FEEDBACK',
      'DIRECTOR_REVISION',
      'DG_APPROVED',
      'SUPERVISOR_NOTIFIED',
      'RESPONSE_PREPARED',
      'RESPONSE_SENT'
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    const maxIndex = statusOrder.length - 1;
    
    if (currentIndex === -1) return 0;
    return Math.round((currentIndex / maxIndex) * 100);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du workflow...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!workflow) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Workflow non trouvé</h1>
            <p className="text-gray-600 mb-6">Le workflow demandé n'existe pas ou vous n'avez pas l'autorisation de le voir.</p>
            <Button onClick={handleBackToCorrespondences}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux correspondances
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const progressPercentage = getProgressPercentage(workflow.currentStatus);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* En-tête de la page */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={handleBackToCorrespondences}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <Workflow className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Workflow de Correspondance Complet</h1>
            </div>
          </div>

          {/* Barre de progression */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Progression du Traitement</CardTitle>
                <Badge className={getStatusColor(workflow.currentStatus)}>
                  {getStatusLabel(workflow.currentStatus)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{progressPercentage}% terminé</p>
            </CardContent>
          </Card>

          {/* Informations rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Correspondance</p>
                    <p className="font-medium text-sm truncate">
                      {workflow.correspondenceId?.subject || 'Sans sujet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Bureau d'Ordre</p>
                    <p className="font-medium text-sm">
                      {workflow.bureauOrdreAgent?.firstName} {workflow.bureauOrdreAgent?.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Directeur Assigné</p>
                    <p className="font-medium text-sm">
                      {workflow.assignedDirector?.firstName} {workflow.assignedDirector?.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-500">Directeur Général</p>
                    <p className="font-medium text-sm">
                      {workflow.directeurGeneral?.firstName} {workflow.directeurGeneral?.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Superviseur si présent */}
          {workflow.superviseurBureauOrdre && (
            <Card className="mb-6 border-l-4 border-l-cyan-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="text-sm font-medium">Superviseur Bureau d'Ordre</p>
                    <p className="text-sm text-gray-600">
                      {workflow.superviseurBureauOrdre.firstName} {workflow.superviseurBureauOrdre.lastName}
                      <span className="text-gray-400 ml-2">({workflow.superviseurBureauOrdre.email})</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correspondance originale */}
          {workflow.correspondenceId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Correspondance Originale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sujet</label>
                    <p className="text-sm font-medium">{workflow.correspondenceId.subject}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">De</label>
                      <p className="text-sm">{workflow.correspondenceId.from}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">À</label>
                      <p className="text-sm">{workflow.correspondenceId.to}</p>
                    </div>
                  </div>
                  {workflow.correspondenceId.content && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contenu</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                        {workflow.correspondenceId.content.length > 300 
                          ? `${workflow.correspondenceId.content.substring(0, 300)}...`
                          : workflow.correspondenceId.content
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations sur les versions de proposition */}
          {workflow.draftVersions && workflow.draftVersions.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Versions des Propositions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.draftVersions.map((draft: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Version {draft.version}</span>
                          <Badge variant="outline" className={
                            draft.status === 'APPROVED' ? 'border-green-500 text-green-700' :
                            draft.status === 'NEEDS_REVISION' ? 'border-red-500 text-red-700' :
                            draft.status === 'UNDER_REVIEW' ? 'border-yellow-500 text-yellow-700' :
                            'border-gray-500 text-gray-700'
                          }>
                            {draft.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(draft.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Par: {draft.createdBy?.firstName} {draft.createdBy?.lastName}
                      </p>
                      {draft.dgFeedback && (
                        <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                          <p className="text-xs font-medium text-orange-700">Feedback DG:</p>
                          <p className="text-sm text-orange-600">{draft.dgFeedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Réponse finale si disponible */}
          {workflow.finalResponse && (
            <Card className="mb-6 border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-base text-green-800">Réponse Finale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm">{workflow.finalResponse.content}</p>
                  </div>
                  {workflow.finalResponse.preparedBy && (
                    <p className="text-xs text-gray-600">
                      Préparée par: {workflow.finalResponse.preparedBy.firstName} {workflow.finalResponse.preparedBy.lastName}
                      {workflow.finalResponse.preparedAt && (
                        <span className="ml-2">
                          le {new Date(workflow.finalResponse.preparedAt).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </p>
                  )}
                  {workflow.finalResponse.sentAt && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Envoyée le {new Date(workflow.finalResponse.sentAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gestionnaire de workflow */}
        {workflowId && (
          <EnhancedWorkflowManager 
            workflowId={workflowId} 
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default EnhancedWorkflowPage;
