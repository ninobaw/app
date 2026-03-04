import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  FileText,
  Eye,
  MessageCircle,
  Users,
  Crown,
  UserCheck,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import WorkflowChatPanel from './WorkflowChatPanel';
import SupervisorWorkflowReview from './SupervisorWorkflowReview';

interface EnhancedWorkflowManagerProps {
  workflowId: string;
  onWorkflowUpdate?: (workflow: any) => void;
}

const EnhancedWorkflowManager: React.FC<EnhancedWorkflowManagerProps> = ({ workflowId, onWorkflowUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // États pour les actions
  const [draftContent, setDraftContent] = useState('');
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // États pour les dialogs
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const response = await api.get(`/api/enhanced-workflow/${workflowId}`);
      if (response.data.success) {
        setWorkflow(response.data.data);
        onWorkflowUpdate?.(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération workflow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectorSubmitDraft = async () => {
    if (!draftContent.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le contenu de la proposition",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append('draftContent', draftContent);
    formData.append('comment', comment);

    try {
      const response = await api.post(`/api/enhanced-workflow/${workflowId}/director-submit-draft`, formData);

      if (response.data.success) {
        setWorkflow(response.data.data);
        setDraftContent('');
        setComment('');
        setShowDraftDialog(false);
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: "Proposition soumise pour révision DG"
        });
      }
    } catch (error: any) {
      console.error('Erreur soumission proposition:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la soumission",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDGFeedback = async (action: 'approve' | 'request_revision') => {
    setActionLoading(true);
    try {
      const response = await api.post(`/api/enhanced-workflow/${workflowId}/dg-feedback`, {
        feedback,
        action,
        draftVersion: workflow?.currentDraftVersion
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setFeedback('');
        setShowFeedbackDialog(false);
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: action === 'approve' ? "Proposition approuvée" : "Demande de révision envoyée"
        });
      }
    } catch (error: any) {
      console.error('Erreur feedback DG:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors du feedback",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
      CREATED: { label: 'Créée', variant: 'secondary', icon: <FileText className="w-3 h-3" /> },
      ASSIGNED_TO_DIRECTOR: { label: 'Assignée au Directeur', variant: 'default', icon: <UserCheck className="w-3 h-3" /> },
      DIRECTOR_DRAFT: { label: 'Proposition en cours', variant: 'default', icon: <MessageSquare className="w-3 h-3" /> },
      DG_REVIEW: { label: 'Révision DG', variant: 'default', icon: <Eye className="w-3 h-3" /> },
      DG_FEEDBACK: { label: 'Feedback DG', variant: 'default', icon: <MessageCircle className="w-3 h-3" /> },
      DG_APPROVED: { label: 'Approuvée DG', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      SUPERVISOR_NOTIFIED: { label: 'Superviseur Notifié', variant: 'default', icon: <Users className="w-3 h-3" /> },
      RESPONSE_SENT: { label: 'Envoyée', variant: 'default', icon: <Send className="w-3 h-3" /> }
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: null };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const canPerformAction = (actionType: string) => {
    if (!workflow || !user) return false;

    switch (actionType) {
      case 'DIRECTOR_DRAFT':
        return (workflow.currentStatus === 'ASSIGNED_TO_DIRECTOR' || workflow.currentStatus === 'DG_FEEDBACK') && 
               workflow.assignedDirector?._id === user.id;
      case 'DG_FEEDBACK':
        return workflow.currentStatus === 'DG_REVIEW' && 
               workflow.directeurGeneral._id === user.id;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Workflow non trouvé
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Workflow de Correspondance Complet
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {workflow.correspondenceId.subject}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(workflow.currentStatus)}
              <Badge variant="outline">
                {workflow.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                Bureau d'Ordre
              </label>
              <p className="text-sm">{workflow.bureauOrdreAgent?.firstName} {workflow.bureauOrdreAgent?.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Directeur Assigné
              </label>
              <p className="text-sm">{workflow.assignedDirector?.firstName} {workflow.assignedDirector?.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Directeur Général
              </label>
              <p className="text-sm">{workflow.directeurGeneral?.firstName} {workflow.directeurGeneral?.lastName}</p>
            </div>
            {workflow.superviseurBureauOrdre && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Superviseur
                </label>
                <p className="text-sm">{workflow.superviseurBureauOrdre.firstName} {workflow.superviseurBureauOrdre.lastName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interface à onglets */}
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          {(user?.role === 'SUPERVISEUR_BUREAU_ORDRE' || user?.role === 'SUPER_ADMIN') && 
           ['DG_APPROVED', 'COMPLETED', 'FINAL_RESPONSE_READY'].includes(workflow?.currentStatus) && (
            <TabsTrigger value="supervisor" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Supervision
            </TabsTrigger>
          )}
        </TabsList>

        {/* Onglet Workflow - Actions disponibles */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
        <CardHeader>
          <CardTitle>Actions Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Directeur: Soumettre proposition */}
          {canPerformAction('DIRECTOR_DRAFT') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {workflow.currentStatus === 'DG_FEEDBACK' ? 'Réviser la proposition' : 'Soumettre proposition de réponse'}
              </h4>
              
              <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {workflow.currentStatus === 'DG_FEEDBACK' ? 'Réviser la proposition' : 'Rédiger une proposition'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {workflow.currentStatus === 'DG_FEEDBACK' ? 'Révision de la Proposition' : 'Proposition de Réponse'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Rédigez votre proposition..."
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      rows={10}
                      className="min-h-[200px]"
                    />
                    <Textarea
                      placeholder="Commentaire (optionnel)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowDraftDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleDirectorSubmitDraft} disabled={actionLoading}>
                        {actionLoading ? 'En cours...' : 'Soumettre la proposition'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Action DG: Révision/Feedback */}
          {canPerformAction('DG_FEEDBACK') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Révision de la proposition
              </h4>
              
              <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Réviser la proposition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Révision de la Proposition</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Votre feedback..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                        Annuler
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDGFeedback('request_revision')}
                        disabled={actionLoading}
                      >
                        Demander une révision
                      </Button>
                      <Button 
                        onClick={() => handleDGFeedback('approve')}
                        disabled={actionLoading}
                      >
                        Approuver
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {workflow.currentStatus === 'RESPONSE_SENT' && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Processus terminé</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                La réponse a été envoyée avec succès. Le workflow est maintenant terminé.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Onglet Chat */}
        <TabsContent value="chat" className="space-y-6">
          <div className="h-[600px]">
            <WorkflowChatPanel 
              workflowId={workflowId} 
              onMessageSent={() => fetchWorkflow()}
            />
          </div>
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique du Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.actions?.map((action: any, index: number) => (
                  <div key={action._id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {action.performedBy?.firstName} {action.performedBy?.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {action.actionType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(action.performedAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {action.comment && (
                        <p className="text-sm text-gray-600 mb-2">{action.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Supervision (visible seulement pour superviseur) */}
        {(user?.role === 'SUPERVISEUR_BUREAU_ORDRE' || user?.role === 'SUPER_ADMIN') && 
         ['DG_APPROVED', 'COMPLETED', 'FINAL_RESPONSE_READY'].includes(workflow?.currentStatus) && (
          <TabsContent value="supervisor" className="space-y-6">
            <SupervisorWorkflowReview workflowId={workflowId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EnhancedWorkflowManager;
