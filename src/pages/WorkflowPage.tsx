import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import WorkflowManager from '@/components/workflow/WorkflowManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Workflow, FileText, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const WorkflowPage: React.FC = () => {
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
      const response = await api.get(`/api/workflow/${workflowId}`);
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
      DG_REVIEW: 'bg-blue-100 text-blue-800',
      DG_ASSIGNED: 'bg-purple-100 text-purple-800',
      DRAFT_RESPONSE: 'bg-yellow-100 text-yellow-800',
      DG_APPROVAL: 'bg-orange-100 text-orange-800',
      DG_REVISION: 'bg-red-100 text-red-800',
      APPROVED: 'bg-green-100 text-green-800',
      RESPONSE_SENT: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
              <h1 className="text-2xl font-bold text-gray-900">Workflow de Correspondance</h1>
            </div>
          </div>

          {/* Informations rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow.currentStatus).split(' ')[0]}`} />
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <Badge variant="outline" className={getStatusColor(workflow.currentStatus)}>
                      {workflow.currentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Directeur Général</p>
                    <p className="font-medium text-sm">
                      {workflow.directeurGeneral?.firstName} {workflow.directeurGeneral?.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Créé le</p>
                    <p className="font-medium text-sm">
                      {new Date(workflow.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignation actuelle */}
          {workflow.assignedTo && (
            <Card className="mb-6 border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Assigné à</p>
                    <p className="text-sm text-gray-600">
                      {workflow.assignedTo.firstName} {workflow.assignedTo.lastName}
                      <span className="text-gray-400 ml-2">({workflow.assignedTo.email})</span>
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
        </div>

        {/* Gestionnaire de workflow */}
        {workflowId && (
          <WorkflowManager 
            workflowId={workflowId} 
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default WorkflowPage;
