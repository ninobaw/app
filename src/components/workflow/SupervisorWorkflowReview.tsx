import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  MessageSquare, 
  User, 
  Download, 
  Paperclip,
  AlertCircle,
  Eye,
  Users,
  Crown,
  Send,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface SupervisorWorkflowReviewProps {
  workflowId: string;
}

interface WorkflowFullContext {
  workflow: {
    id: string;
    currentStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  correspondance: {
    id: string;
    subject: string;
    content: string;
    attachments: Array<{
      filename: string;
      originalName: string;
      path: string;
      size: number;
      mimetype: string;
    }>;
    priority: string;
    createdAt: string;
  };
  participants: {
    director: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    dg: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  };
  chatMessages: Array<{
    id: string;
    from: {
      id: string;
      name: string;
      role: string;
    };
    to: {
      id: string;
      name: string;
      role: string;
    };
    message: string;
    draftVersion?: string;
    attachments: Array<{
      filename: string;
      originalName: string;
      path: string;
      size: number;
      mimetype: string;
    }>;
    timestamp: string;
  }>;
  actions: Array<{
    id: string;
    actionType: string;
    performedBy: {
      id: string;
      name: string;
      role: string;
    };
    comment: string;
    timestamp: string;
  }>;
  finalResponse: string | null;
  allDrafts: Array<{
    version: string;
    content: string;
    createdAt: string;
    attachments: any[];
  }>;
}

const SupervisorWorkflowReview: React.FC<SupervisorWorkflowReviewProps> = ({ workflowId }) => {
  const { toast } = useToast();
  const [context, setContext] = useState<WorkflowFullContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalResponseDraft, setFinalResponseDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFullContext();
  }, [workflowId]);

  const fetchFullContext = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/workflow-chat/${workflowId}/full-context`);
      
      if (response.data.success) {
        setContext(response.data.data);
        setFinalResponseDraft(response.data.data.finalResponse || '');
        console.log('📋 Contexte complet chargé:', response.data.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement contexte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le contexte du workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (filename: string, originalName: string, isCorrespondanceAttachment = false) => {
    try {
      const url = isCorrespondanceAttachment 
        ? `/uploads/resolve/${filename}`
        : `/api/workflow-chat/attachment/${filename}`;
        
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
  };

  const submitFinalResponse = async () => {
    if (!finalResponseDraft.trim()) {
      toast({
        title: "Réponse vide",
        description: "Veuillez saisir la réponse finale",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // TODO: Implémenter l'API pour soumettre la réponse finale
      const response = await api.post(`/api/enhanced-workflow/${workflowId}/supervisor-finalize`, {
        finalResponse: finalResponseDraft.trim()
      });

      if (response.data.success) {
        toast({
          title: "Réponse finalisée",
          description: "La réponse finale a été soumise avec succès",
        });
        await fetchFullContext(); // Recharger le contexte
      }
    } catch (error) {
      console.error('❌ Erreur soumission réponse finale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la réponse finale",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DIRECTEUR_GENERAL': return 'bg-purple-100 text-purple-800';
      case 'DIRECTEUR': return 'bg-blue-100 text-blue-800';
      case 'SOUS_DIRECTEUR': return 'bg-green-100 text-green-800';
      case 'SUPERVISEUR_BUREAU_ORDRE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DG_APPROVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'FINAL_RESPONSE_READY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: { [key: string]: string } = {
      'DIRECTOR_SUBMIT_DRAFT': 'Proposition soumise',
      'DG_APPROVE': 'Approuvé par DG',
      'DG_REQUEST_REVISION': 'Révision demandée',
      'DIRECTOR_REVISE': 'Révision soumise',
      'SUPERVISOR_FINALIZE': 'Finalisé par superviseur'
    };
    return labels[actionType] || actionType;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Chargement du contexte complet...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-500">Impossible de charger le contexte du workflow</p>
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Révision Superviseur - Workflow Complet
            </div>
            <Badge className={getStatusColor(context.workflow.currentStatus)}>
              {context.workflow.currentStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Créé le:</p>
              <p className="text-sm">{new Date(context.workflow.createdAt).toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Dernière mise à jour:</p>
              <p className="text-sm">{new Date(context.workflow.updatedAt).toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {context.participants.director && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{context.participants.director.name}</p>
                    <p className="text-sm text-gray-600">{context.participants.director.email}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(context.participants.director.role)}>
                  {context.participants.director.role}
                </Badge>
              </div>
            )}
            
            {context.participants.dg && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{context.participants.dg.name}</p>
                    <p className="text-sm text-gray-600">{context.participants.dg.email}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(context.participants.dg.role)}>
                  {context.participants.dg.role}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Correspondance originale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Correspondance Originale
            <Badge className={getPriorityColor(context.correspondance.priority)}>
              {context.correspondance.priority}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Sujet:</h4>
            <p className="text-sm">{context.correspondance.subject}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Contenu:</h4>
            <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{context.correspondance.content}</p>
            </div>
          </div>

          {context.correspondance.attachments && context.correspondance.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Pièces jointes:</h4>
              <div className="space-y-2">
                {context.correspondance.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {attachment.originalName || attachment.filename}
                      </span>
                      {attachment.size && (
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(attachment.size)})
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadAttachment(
                        attachment.filename, 
                        attachment.originalName || attachment.filename,
                        true
                      )}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Actions ({context.actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {context.actions.map((action) => (
              <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{getActionTypeLabel(action.actionType)}</span>
                    <Badge className={getRoleColor(action.performedBy.role)} variant="outline">
                      {action.performedBy.name}
                    </Badge>
                  </div>
                  {action.comment && (
                    <p className="text-sm text-gray-700 mb-1">{action.comment}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(action.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages de discussion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion Complète ({context.chatMessages.length} messages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {context.chatMessages.map((message) => (
                <div key={message.id} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-sm">{message.from.name}</span>
                    <Badge className={getRoleColor(message.from.role)} variant="outline">
                      {message.from.role}
                    </Badge>
                    {message.draftVersion && (
                      <Badge variant="outline" className="text-xs">
                        {message.draftVersion}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(message.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap mb-2">{message.message}</p>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-blue-600">
                          <Paperclip className="h-3 w-3" />
                          <button
                            onClick={() => downloadAttachment(attachment.filename, attachment.originalName)}
                            className="hover:underline"
                          >
                            {attachment.originalName} ({formatFileSize(attachment.size)})
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Toutes les versions de brouillons */}
      {context.allDrafts && context.allDrafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Toutes les Versions de Réponse ({context.allDrafts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {context.allDrafts.map((draft, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{draft.version}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(draft.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{draft.content}</p>
                  </div>
                  {draft.attachments && draft.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {draft.attachments.map((attachment: any, attIndex: number) => (
                        <div key={attIndex} className="flex items-center gap-2 text-xs text-blue-600">
                          <Paperclip className="h-3 w-3" />
                          <span>{attachment.originalName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de rédaction de la réponse finale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Réponse Finale du Superviseur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formuler la réponse finale basée sur toute la discussion:
            </label>
            <Textarea
              placeholder="Rédigez ici la réponse finale qui sera envoyée..."
              value={finalResponseDraft}
              onChange={(e) => setFinalResponseDraft(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={submitFinalResponse}
              disabled={submitting || !finalResponseDraft.trim()}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Soumission...' : 'Soumettre la Réponse Finale'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorWorkflowReview;
