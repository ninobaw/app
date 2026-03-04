import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

// Types pour le workflow
export interface WorkflowAction {
  _id: string;
  actionType: string;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  performedAt: string;
  comment?: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  draftResponse?: string;
}

export interface CorrespondenceWorkflow {
  _id: string;
  correspondenceId: {
    _id: string;
    subject: string;
    content: string;
    from: string;
    to: string;
  };
  currentStatus: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  directeurGeneral: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentDraftResponse?: string;
  finalResponse?: string;
  actions: WorkflowAction[];
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowManagerProps {
  workflowId: string;
  onWorkflowUpdate?: (workflow: CorrespondenceWorkflow) => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ workflowId, onWorkflowUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<CorrespondenceWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  // États pour les actions
  const [comment, setComment] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    fetchWorkflow();
    fetchUsers();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const response = await api.get(`/api/workflow/${workflowId}`);
      if (response.data.success) {
        setWorkflow(response.data.data);
        setDraftResponse(response.data.data.currentDraftResponse || '');
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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
    }
  };

  const handleDGAssign = async () => {
    if (!comment.trim() || !assignedUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un commentaire et sélectionner une personne",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/api/workflow/${workflowId}/dg-assign`, {
        comment: comment.trim(),
        assignedToId: assignedUserId
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setComment('');
        setAssignedUserId('');
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: "Consigne ajoutée et correspondance assignée"
        });
      }
    } catch (error: any) {
      console.error('Erreur assignation DG:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'assignation",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!draftResponse.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une proposition de réponse",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/api/workflow/${workflowId}/submit-draft`, {
        draftResponse: draftResponse.trim(),
        comment: comment.trim() || 'Proposition de réponse soumise'
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setComment('');
        setShowDraftDialog(false);
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: "Proposition de réponse soumise pour approbation"
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

  const handleDGReview = async (action: 'approve' | 'reject', finalResponse?: string) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/api/workflow/${workflowId}/dg-review`, {
        action,
        comment: comment.trim(),
        finalResponse
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setComment('');
        setShowReviewDialog(false);
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: action === 'approve' ? "Réponse approuvée" : "Demande de révision envoyée"
        });
      }
    } catch (error: any) {
      console.error('Erreur révision DG:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la révision",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendResponse = async () => {
    setActionLoading(true);
    try {
      const response = await api.post(`/api/workflow/${workflowId}/send-response`, {
        comment: comment.trim() || 'Réponse envoyée'
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setComment('');
        onWorkflowUpdate?.(response.data.data);
        toast({
          title: "Succès",
          description: "Réponse envoyée avec succès"
        });
      }
    } catch (error: any) {
      console.error('Erreur envoi réponse:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
      CREATED: { label: 'Créée', variant: 'secondary', icon: <FileText className="w-3 h-3" /> },
      DG_REVIEW: { label: 'Révision DG', variant: 'default', icon: <Eye className="w-3 h-3" /> },
      DG_ASSIGNED: { label: 'Assignée', variant: 'default', icon: <User className="w-3 h-3" /> },
      DRAFT_RESPONSE: { label: 'Proposition', variant: 'default', icon: <MessageSquare className="w-3 h-3" /> },
      DG_APPROVAL: { label: 'Approbation DG', variant: 'default', icon: <Clock className="w-3 h-3" /> },
      DG_REVISION: { label: 'Révision demandée', variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      APPROVED: { label: 'Approuvée', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; variant: any }> = {
      LOW: { label: 'Faible', variant: 'secondary' },
      MEDIUM: { label: 'Moyenne', variant: 'default' },
      HIGH: { label: 'Élevée', variant: 'destructive' },
      URGENT: { label: 'Urgente', variant: 'destructive' }
    };

    const config = priorityConfig[priority] || { label: priority, variant: 'secondary' };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const canPerformAction = (actionType: string) => {
    if (!workflow || !user) return false;

    switch (actionType) {
      case 'DG_ASSIGN':
        return workflow.currentStatus === 'DG_REVIEW' && 
               workflow.directeurGeneral._id === user.id;
      case 'SUBMIT_DRAFT':
        return (workflow.currentStatus === 'DG_ASSIGNED' || workflow.currentStatus === 'DG_REVISION') && 
               workflow.assignedTo?._id === user.id;
      case 'DG_REVIEW':
        return workflow.currentStatus === 'DG_APPROVAL' && 
               workflow.directeurGeneral._id === user.id;
      case 'SEND_RESPONSE':
        return workflow.currentStatus === 'APPROVED' && 
               (workflow.directeurGeneral._id === user.id || workflow.assignedTo?._id === user.id);
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
                Workflow de Correspondance
              </CardTitle>
              <CardDescription>
                {workflow.correspondenceId.subject}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(workflow.currentStatus)}
              {getPriorityBadge(workflow.priority)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Créé par</label>
              <p className="text-sm">{workflow.createdBy.firstName} {workflow.createdBy.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Directeur Général</label>
              <p className="text-sm">{workflow.directeurGeneral.firstName} {workflow.directeurGeneral.lastName}</p>
            </div>
            {workflow.assignedTo && (
              <div>
                <label className="text-sm font-medium text-gray-500">Assigné à</label>
                <p className="text-sm">{workflow.assignedTo.firstName} {workflow.assignedTo.lastName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action DG: Ajouter consigne et assigner */}
          {canPerformAction('DG_ASSIGN') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Ajouter une consigne et assigner
              </h4>
              <Textarea
                placeholder="Saisissez votre consigne..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une personne" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleDGAssign} 
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? 'En cours...' : 'Assigner la correspondance'}
              </Button>
            </div>
          )}

          {/* Action: Soumettre proposition de réponse */}
          {canPerformAction('SUBMIT_DRAFT') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Proposer une réponse
              </h4>
              <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Rédiger une proposition de réponse
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Proposition de Réponse</DialogTitle>
                    <DialogDescription>
                      Rédigez votre proposition de réponse pour cette correspondance
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Rédigez votre proposition de réponse..."
                      value={draftResponse}
                      onChange={(e) => setDraftResponse(e.target.value)}
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
                      <Button onClick={handleSubmitDraft} disabled={actionLoading}>
                        {actionLoading ? 'En cours...' : 'Soumettre la proposition'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Action DG: Révision/Approbation */}
          {canPerformAction('DG_REVIEW') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Révision de la proposition
              </h4>
              {workflow.currentDraftResponse && (
                <div className="p-3 bg-gray-50 rounded border">
                  <label className="text-sm font-medium text-gray-500">Proposition actuelle:</label>
                  <p className="text-sm mt-1">{workflow.currentDraftResponse}</p>
                </div>
              )}
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Réviser la proposition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Révision de la Proposition</DialogTitle>
                    <DialogDescription>
                      Approuvez ou demandez une révision de la proposition
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded border">
                      <label className="text-sm font-medium text-gray-500">Proposition:</label>
                      <p className="text-sm mt-1">{workflow.currentDraftResponse}</p>
                    </div>
                    <Textarea
                      placeholder="Commentaire..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                        Annuler
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDGReview('reject')}
                        disabled={actionLoading}
                      >
                        Demander une révision
                      </Button>
                      <Button 
                        onClick={() => handleDGReview('approve')}
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

          {/* Action: Envoyer réponse finale */}
          {canPerformAction('SEND_RESPONSE') && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Send className="w-4 h-4" />
                Envoyer la réponse finale
              </h4>
              {workflow.finalResponse && (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <label className="text-sm font-medium text-green-700">Réponse approuvée:</label>
                  <p className="text-sm mt-1">{workflow.finalResponse}</p>
                </div>
              )}
              <Textarea
                placeholder="Commentaire pour l'envoi (optionnel)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button 
                onClick={handleSendResponse} 
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? 'En cours...' : 'Envoyer la réponse'}
              </Button>
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

      {/* Historique des actions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique du Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.actions.map((action, index) => (
              <div key={action._id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {action.performedBy.firstName} {action.performedBy.lastName}
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
                  {action.assignedTo && (
                    <p className="text-xs text-blue-600">
                      Assigné à: {action.assignedTo.firstName} {action.assignedTo.lastName}
                    </p>
                  )}
                  {action.draftResponse && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Proposition:</strong> {action.draftResponse.substring(0, 200)}
                      {action.draftResponse.length > 200 && '...'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManager;
