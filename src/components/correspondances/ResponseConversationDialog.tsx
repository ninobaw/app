import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  FileText,
  Crown,
  Paperclip,
  Download,
  X,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCorrespondanceWorkflow,
  useWorkflowStatus
} from '@/hooks/useCorrespondanceWorkflow';
import WorkflowChatPanel from '../workflow/WorkflowChatPanel';
import api from '@/lib/axios';

interface ResponseConversationDialogProps {
  correspondanceId: string;
  isOpen: boolean;
  onClose: () => void;
  correspondanceData?: any;
}

interface ConversationMessage {
  id: string;
  type: 'proposal' | 'feedback' | 'revision';
  author: {
    id: string;
    name: string;
    role: string;
  };
  content: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  timestamp: string;
  status?: string;
  action?: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';
  revisionRequests?: string[];
}

export const ResponseConversationDialog: React.FC<ResponseConversationDialogProps> = ({
  correspondanceId,
  isOpen,
  onClose,
  correspondanceData
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageType, setMessageType] = useState<'proposal' | 'feedback'>('proposal');
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Hooks pour les actions de workflow
  const { createResponseDraft, provideDGFeedback, reviseResponseDraft } = useCorrespondanceWorkflow();
  const { data: workflowData, isLoading } = useWorkflowStatus(correspondanceId);

  // Déterminer le rôle de l'utilisateur
  const isDirector = user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR';
  const isDG = user?.role === 'DIRECTEUR_GENERAL';
  
  // Vérifier si la correspondance est approuvée par le DG (conversation fermée)
  const isApprovedByDG = workflowData?.workflowStatus === 'DG_APPROVED';
  const hasApprovedFeedback = workflowData?.responseDrafts?.some((draft: any) => 
    draft.dgFeedbacks?.some((feedback: any) => feedback.action === 'APPROVE')
  );
  
  // Récupérer l'ID du workflow pour cette correspondance
  useEffect(() => {
    const fetchWorkflowId = async () => {
      if (!isOpen || !correspondanceId) return;
      
      try {
        console.log('🔍 [ResponseDialog] Recherche workflow pour correspondance:', correspondanceId);
        const response = await api.get(`/api/workflow-chat/by-correspondance/${correspondanceId}`);
        if (response.data.success && response.data.data) {
          setWorkflowId(response.data.data._id);
          console.log('✅ [ResponseDialog] Workflow ID trouvé:', response.data.data._id);
        }
      } catch (error) {
        console.error('❌ [ResponseDialog] Erreur récupération workflow ID:', error);
      }
    };

    if (isOpen && correspondanceId) {
      fetchWorkflowId();
      
      // Rafraîchissement automatique toutes les 10 secondes pour synchroniser les messages
      const interval = setInterval(() => {
        console.log('🔄 [ResponseDialog] Rafraîchissement automatique des données');
        fetchWorkflowId();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, correspondanceId]);

  // Debug des conditions d'affichage
  console.log('🔍 [ResponseDialog] Debug conditions:', {
    userRole: user?.role,
    isDirector,
    isDG,
    isApprovedByDG,
    hasApprovedFeedback,
    canShowInput: (isDirector || isDG) && !isApprovedByDG && !hasApprovedFeedback,
    workflowStatus: workflowData?.workflowStatus,
    responseDraftsCount: workflowData?.responseDrafts?.length || 0,
    workflowData: workflowData,
    workflowId: workflowId
  });

  // Debug spécial pour le DG
  if (isDG) {
    console.log('🔍 [DG] Debug spécifique DG:', {
      workflowData,
      responseDrafts: workflowData?.responseDrafts,
      dgFeedbacks: workflowData?.responseDrafts?.map((draft: any) => ({
        draftId: draft._id,
        dgFeedbacks: draft.dgFeedbacks,
        hasApprovalFeedback: draft.dgFeedbacks?.some((feedback: any) => feedback.action === 'APPROVE')
      }))
    });
  }

  // Construire la conversation à partir des données de workflow
  const buildConversation = (): ConversationMessage[] => {
    const messages: ConversationMessage[] = [];
    
    if (workflowData?.responseDrafts) {
      workflowData.responseDrafts.forEach((draft: any, draftIndex: number) => {
        // Message de proposition initiale
        messages.push({
          id: `draft-${draftIndex}`,
          type: 'proposal',
          author: {
            id: draft.directorId,
            name: draft.directorName,
            role: 'DIRECTEUR'
          },
          content: draft.responseContent,
          attachments: Array.isArray(draft.attachments) ? draft.attachments.map((att: any) => {
            if (typeof att === 'string') {
              return { 
                name: att.split('/').pop() || att,
                url: `/uploads/resolve/${encodeURIComponent(att)}`,
                type: 'file',
                fullPath: att
              };
            }
            return att;
          }) : [],
          timestamp: draft.createdAt,
          status: draft.status
        });

        // Messages de feedback du DG
        if (draft.dgFeedbacks) {
          draft.dgFeedbacks.forEach((feedback: any, feedbackIndex: number) => {
            messages.push({
              id: `feedback-${draftIndex}-${feedbackIndex}`,
              type: 'feedback',
              author: {
                id: feedback.dgId,
                name: feedback.dgName,
                role: 'DIRECTEUR_GENERAL'
              },
              content: feedback.feedback,
              attachments: Array.isArray(feedback.attachments) ? feedback.attachments.map((att: any) => {
                if (typeof att === 'string') {
                  return { 
                    name: att.split('/').pop() || att,
                    url: `/uploads/resolve/${encodeURIComponent(att)}`,
                    type: 'file',
                    fullPath: att
                  };
                }
                return att;
              }) : [],
              timestamp: feedback.createdAt,
              action: feedback.action,
              revisionRequests: feedback.revisionRequests || []
            });
          });
        }

        // Messages de révision
        if (draft.revisionHistory) {
          draft.revisionHistory.forEach((revision: any, revisionIndex: number) => {
            messages.push({
              id: `revision-${draftIndex}-${revisionIndex}`,
              type: 'revision',
              author: {
                id: draft.directorId,
                name: draft.directorName,
                role: 'DIRECTEUR'
              },
              content: revision.revisionComments || 'Proposition révisée',
              attachments: Array.isArray(revision.attachments) ? revision.attachments.map((att: any) => {
                if (typeof att === 'string') {
                  return { 
                    name: att.split('/').pop() || att,
                    url: `/uploads/resolve/${encodeURIComponent(att)}`,
                    type: 'file',
                    fullPath: att
                  };
                }
                return att;
              }) : [],
              timestamp: revision.revisionDate
            });
          });
        }
      });
    }

    // Trier par timestamp
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const conversation = buildConversation();
  
  // Debug de la conversation
  console.log('🔍 [Conversation] Messages construits:', {
    messagesCount: conversation.length,
    messages: conversation,
    workflowData: workflowData,
    responseDrafts: workflowData?.responseDrafts,
    responseDraftsLength: workflowData?.responseDrafts?.length
  });
  
  // Debug spécial si pas de messages mais workflowData existe
  if (conversation.length === 0 && workflowData) {
    console.log('🔍 [Conversation] Aucun message mais workflowData existe:', {
      workflowData,
      hasResponseDrafts: !!workflowData.responseDrafts,
      responseDraftsType: typeof workflowData.responseDrafts,
      responseDraftsArray: Array.isArray(workflowData.responseDrafts)
    });
  }

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.length]);

  // Gestion des fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    // Réinitialiser l'input pour permettre la sélection du même fichier
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Upload des fichiers vers le serveur
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    const uploadedFiles: string[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('correspondanceId', correspondanceId);
      
      try {
        const response = await fetch('/api/uploads/attachment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedFiles.push(result.filename || file.name);
        } else {
          console.error('Erreur upload fichier:', file.name);
          uploadedFiles.push(file.name); // Fallback au nom du fichier
        }
      } catch (error) {
        console.error('Erreur upload fichier:', error);
        uploadedFiles.push(file.name); // Fallback au nom du fichier
      }
    }
    
    return uploadedFiles;
  };

  // Soumettre un nouveau message
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      // Upload des fichiers d'abord
      const uploadedAttachments = await uploadFiles(attachments);

      if (isDirector) {
        // Directeur soumet une proposition ou révision
        const existingDraft = workflowData?.responseDrafts?.find(
          (draft: any) => draft.directorId === user?.id
        );

        if (existingDraft && existingDraft.status === 'REVISION_REQUESTED') {
          // C'est une révision
          await reviseResponseDraft.mutateAsync({
            correspondanceId,
            draftIndex: 0, // Simplification - on assume un seul draft par directeur
            responseContent: newMessage,
            attachments: uploadedAttachments,
            revisionComments: `Révision effectuée le ${new Date().toLocaleDateString('fr-FR')}`
          });
        } else {
          // Nouvelle proposition
          await createResponseDraft.mutateAsync({
            correspondanceId,
            responseContent: newMessage,
            attachments: uploadedAttachments,
            comments: `Proposition soumise le ${new Date().toLocaleDateString('fr-FR')}`,
            isUrgent: false
          });
        }
      } else if (isDG) {
        // DG donne un feedback avec possibilité d'attachements
        const action: 'APPROVE' | 'REQUEST_REVISION' = messageType === 'feedback' ? 'REQUEST_REVISION' : 'APPROVE';
        
        // Envoyer le feedback avec les attachements
        await provideDGFeedback.mutateAsync({
          correspondanceId,
          draftIndex: 0, // Simplification
          action,
          feedback: newMessage,
          revisionRequests: action === 'REQUEST_REVISION' ? [] : [], // Éviter la duplication
          attachments: uploadedAttachments // Inclure les attachements du DG
        });
      }

      // Reset du formulaire
      setNewMessage('');
      setAttachments([]);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Afficher une notification d'erreur à l'utilisateur
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu d'un message de conversation amélioré
  const renderMessage = (message: ConversationMessage) => {
    const isMyMessage = message.author.id === user?.id;
    const isProposal = message.type === 'proposal';
    const isFeedback = message.type === 'feedback';
    
    return (
      <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
          {/* Avatar et nom */}
          <div className={`flex items-center mb-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-center space-x-2 ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                message.author.role === 'DIRECTEUR_GENERAL' ? 'bg-purple-500' : 
                isMyMessage ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                {message.author.role === 'DIRECTEUR_GENERAL' ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  message.author.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className={`text-sm ${isMyMessage ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-gray-900">{message.author.name}</span>
                <div className="flex items-center space-x-1 mt-0.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {message.author.role === 'DIRECTEUR_GENERAL' ? 'DG' : 'Directeur'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bulle de message améliorée */}
          <div className={`relative ${isMyMessage ? 'ml-6' : 'mr-6'}`}>
            <div className={`rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
              isMyMessage 
                ? 'bg-blue-500 text-white' 
                : isProposal 
                  ? 'bg-white border-2 border-blue-300 hover:border-blue-400' 
                  : isFeedback 
                    ? 'bg-purple-50 border-2 border-purple-300 hover:border-purple-400'
                    : 'bg-yellow-50 border-2 border-yellow-300 hover:border-yellow-400'
            }`}>
              {/* Badges de statut */}
              {(message.status || message.action) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {message.status && (
                    <Badge className={`text-xs ${
                      message.status === 'APPROVED' ? 'bg-green-500 text-white' :
                      message.status === 'REVISION_REQUESTED' ? 'bg-orange-500 text-white' :
                      message.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {message.status}
                    </Badge>
                  )}
                  {message.action && (
                    <Badge className={`text-xs ${
                      message.action === 'APPROVE' ? 'bg-green-600 text-white' :
                      message.action === 'REQUEST_REVISION' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {message.action}
                    </Badge>
                  )}
                </div>
              )}

              {/* Contenu du message amélioré */}
              <div className={`text-sm leading-relaxed ${isMyMessage ? 'text-white' : 'text-gray-900'}`}>
                {/* Indicateur spécial pour les demandes de révision */}
                {message.action === 'REQUEST_REVISION' && (
                  <div className="flex items-center space-x-2 mb-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Demande de révision :</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>

              {/* Points de révision spécifiques (éviter la duplication) */}
              {message.revisionRequests && message.revisionRequests.length > 0 && (
                (() => {
                  // Filtrer les revisionRequests qui sont identiques au contenu principal
                  const uniqueRequests = message.revisionRequests.filter(request => 
                    request.trim() !== message.content.trim()
                  );
                  
                  return uniqueRequests.length > 0 && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Points à réviser :</span>
                      </div>
                      <ul className="text-sm space-y-1 text-orange-700">
                        {uniqueRequests.map((request, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{request}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()
              )}

              {/* Pièces jointes modernes */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Paperclip className={`w-4 h-4 ${isMyMessage ? 'text-blue-200' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium ${isMyMessage ? 'text-blue-200' : 'text-gray-600'}`}>
                      {message.attachments.length} fichier{message.attachments.length > 1 ? 's' : ''} joint{message.attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {message.attachments.map((attachment, index) => {
                      // Construire l'URL de téléchargement
                      const downloadUrl = attachment.url || (attachment.name ? `/uploads/resolve/${encodeURIComponent(attachment.name)}` : '#');
                      
                      return (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-opacity-80 ${
                        isMyMessage ? 'bg-blue-600 bg-opacity-20' : 'bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${isMyMessage ? 'bg-blue-600 bg-opacity-30' : 'bg-gray-200'}`}>
                            <FileText className={`w-4 h-4 ${isMyMessage ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isMyMessage ? 'text-white' : 'text-gray-900'}`}>
                              {attachment.name}
                            </p>
                            <p className={`text-xs ${isMyMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                              {attachment.type || 'Fichier'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`ml-2 ${isMyMessage ? 'text-white hover:bg-blue-600 hover:bg-opacity-30' : 'text-gray-600 hover:bg-gray-200'}`}
                          onClick={() => window.open(downloadUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Flèche de la bulle */}
            <div className={`absolute top-3 ${isMyMessage ? 'right-[-6px]' : 'left-[-6px]'}`}>
              <div className={`w-3 h-3 rotate-45 ${
                isMyMessage 
                  ? 'bg-blue-500' 
                  : isProposal 
                    ? 'bg-white border-r border-b border-blue-200' 
                    : isFeedback 
                      ? 'bg-white border-r border-b border-purple-200'
                      : 'bg-white border-r border-b border-yellow-200'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Conversation - Proposition de Réponse
          </DialogTitle>
          <DialogDescription>
            {correspondanceData?.subject || 'Échanges sur la proposition de réponse'}
          </DialogDescription>
        </DialogHeader>

        {/* Onglets pour séparer les propositions et le chat workflow */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="proposals" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Propositions & Feedback
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat Workflow
                {workflowId && <Badge variant="secondary" className="ml-1 text-xs">Actif</Badge>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="proposals" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full border rounded-lg bg-gradient-to-b from-gray-50 to-white">
                <div className="p-4">
                  {conversation.length > 0 ? (
                    <div className="space-y-4">
                      {conversation.map(renderMessage)}
                      <div ref={messagesEndRef} className="h-2" />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                        <Crown className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune proposition</h3>
                      <p className="text-sm text-gray-600 max-w-sm mx-auto">
                        Commencez par créer une proposition de réponse pour démarrer la conversation
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 min-h-0 mt-4">
              {workflowId ? (
                <div className="h-full border rounded-lg overflow-hidden">
                  <WorkflowChatPanel 
                    workflowId={workflowId}
                    onMessageSent={() => {
                      // Optionnel: rafraîchir les données
                      console.log('💬 [ResponseDialog] Message envoyé dans le chat workflow');
                    }}
                  />
                </div>
              ) : (
                <div className="h-full border rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chat non disponible</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      Le workflow n'est pas encore créé pour cette correspondance
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Message de fermeture de conversation */}
        {(isApprovedByDG || hasApprovedFeedback) && (
            <div className="mt-4">
              <Separator />
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Proposition approuvée par le Directeur Général</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Cette correspondance a été approuvée et est maintenant transmise au superviseur bureau d'ordre 
                  pour finalisation et envoi. La conversation est fermée.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  📋 L'historique complet des échanges reste disponible pour consultation.
                </p>
              </div>
            </div>
          )}

        {/* Zone de saisie */}
        {(isDirector || isDG) && !isApprovedByDG && !hasApprovedFeedback && (
          <div className="flex-shrink-0 mt-4 max-h-[40vh] overflow-y-auto border-t bg-white">
            <div className="p-4 space-y-4">
            {/* Sélecteur de type de message pour le DG */}
            {isDG && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-900">Type d'action :</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={messageType === 'feedback' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('feedback')}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Demander révision
                  </Button>
                  <Button
                    variant={messageType === 'proposal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('proposal')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approuver avec commentaires
                  </Button>
                </div>
                <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                  💡 Vous pouvez joindre des documents à vos commentaires (guides, exemples, références...)
                </p>
              </div>
            )}

            {/* Pièces jointes sélectionnées */}
            {attachments.length > 0 && (
              <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-800">
                    {attachments.length} fichier{attachments.length > 1 ? 's' : ''} à envoyer :
                  </p>
                </div>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone de saisie du message */}
            <div className="space-y-4 p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {isDirector ? 'Votre proposition de réponse :' :
                   messageType === 'feedback' ? 'Vos commentaires et consignes :' :
                   'Commentaires d\'approbation :'}
                </label>
                <Textarea
                  placeholder={
                    isDirector ? 'Rédigez votre proposition de réponse détaillée...' :
                    messageType === 'feedback' ? 'Rédigez vos commentaires et consignes de révision...' :
                    'Ajoutez vos commentaires d\'approbation et félicitations...'
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={6}
                  className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base p-4 min-h-[120px]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={triggerFileSelect}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 h-10"
                  >
                    <Paperclip className="w-5 h-5" />
                    Joindre fichier
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
                  />
                  <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    📎 PDF, Word, Excel, images acceptés
                  </span>
                </div>

                <Button
                  onClick={handleSubmitMessage}
                  disabled={!newMessage.trim() || isSubmitting}
                  size="default"
                  className={`flex items-center gap-3 min-w-[160px] px-6 py-3 h-12 text-base font-medium ${
                    messageType === 'feedback' ? 'bg-orange-600 hover:bg-orange-700' : 
                    messageType === 'proposal' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-base">Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="text-base font-medium">
                        {isDirector ? 'Envoyer la proposition' : 
                         messageType === 'feedback' ? 'Demander révision' : 'Approuver la réponse'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
