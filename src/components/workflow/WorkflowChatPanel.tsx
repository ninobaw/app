import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Crown, 
  ThumbsUp, 
  CheckCircle2,
  FileText,
  Download,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
interface WorkflowChatPanelProps {
  workflowId: string;
  onMessageSent?: () => void;
}

interface ChatMessage {
  id: string;
  from: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  to: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message: string;
  draftVersion?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    size: number;
  }>;
  timestamp: string;
  isRead: boolean;
}

const WorkflowChatPanel: React.FC<WorkflowChatPanelProps> = ({ workflowId, onMessageSent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  // États pour les modales DG
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les messages
  const loadMessages = async () => {
    try {
      console.log('🔄 [WorkflowChat] Rechargement messages pour workflow:', workflowId);
      const response = await api.get(`/api/workflow-chat/${workflowId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data.chatMessages || []);
        setWorkflowData(response.data.data);
        console.log('📨 [WorkflowChat] Messages chargés:', response.data.data.chatMessages?.length || 0);
        console.log('🔄 [WorkflowChat] Workflow status:', response.data.data.currentStatus);
        
        // ✅ LOGS DEBUG DÉTAILLÉS POUR DG
        console.log('🎯 [WorkflowChat] DEBUG DONNÉES COMPLÈTES:', {
          workflowId: response.data.data.workflowId,
          currentStatus: response.data.data.currentStatus,
          correspondance: {
            workflowStatus: response.data.data.correspondance?.workflowStatus,
            responseDrafts: response.data.data.correspondance?.responseDrafts?.length || 0,
            draftsDetails: response.data.data.correspondance?.responseDrafts?.map((d: any) => ({
              status: d.status,
              directorName: d.directorName
            }))
          }
        });
        
        // ✅ LOGS CONDITIONS BOUTON DG
        if (user?.role === 'DIRECTEUR_GENERAL') {
          const condition1 = user?.role === 'DIRECTEUR_GENERAL';
          const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(response.data.data.currentStatus);
          const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(response.data.data.correspondance?.workflowStatus);
          const condition4 = response.data.data.correspondance?.responseDrafts && 
                            response.data.data.correspondance.responseDrafts.some((draft: any) => draft.status === 'PENDING_DG_REVIEW');
          
          console.log('🎯 [WorkflowChat] CONDITIONS BOUTON DG:', {
            condition1_userRole: condition1,
            condition2_currentStatus: condition2,
            condition3_corrWorkflowStatus: condition3,
            condition4_pendingDrafts: condition4,
            globalCondition: condition1 && (condition2 || condition3 || condition4)
          });
        }
      }
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur chargement messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workflowId) {
      loadMessages();
      // Polling pour les nouveaux messages
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [workflowId]);

  // Scroll intelligent - seulement si l'utilisateur n'a pas scrollé manuellement
  useEffect(() => {
    if (shouldAutoScroll && !userHasScrolled) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100); // Petit délai pour laisser le temps au DOM de se mettre à jour
      
      return () => clearTimeout(timer);
    }
  }, [messages, shouldAutoScroll, userHasScrolled]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('message', newMessage);
      formData.append('toUserId', 'auto'); // Le backend déterminera automatiquement

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post(`/api/workflow-chat/${workflowId}/send-message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewMessage('');
      setAttachments([]);
      
      // Forcer le scroll vers le bas après envoi d'un message
      setShouldAutoScroll(true);
      setUserHasScrolled(false);
      
      await loadMessages();
      onMessageSent?.();

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Fonction pour envoyer un message avec attachements (pour les modales DG)
  const sendMessageWithAttachments = async (message: string, files: File[]) => {
    const formData = new FormData();
    formData.append('message', message);
    
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post(`/api/workflow-chat/${workflowId}/send-message`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      await loadMessages();
      onMessageSent?.();
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      console.log('📥 [WorkflowChat] Téléchargement fichier:', attachment);
      
      // Utiliser directement la route de téléchargement du workflow-chat
      const downloadUrl = `/api/workflow-chat/download/${attachment.filename}`;
      console.log('🔗 [WorkflowChat] URL de téléchargement:', downloadUrl);
      
      const response = await api.get(downloadUrl, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalName || attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [WorkflowChat] Téléchargement réussi:', attachment.originalName);
      
      toast({
        title: "Téléchargement réussi",
        description: `Fichier "${attachment.originalName}" téléchargé`,
      });
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier. Vérifiez qu'il existe encore.",
        variant: "destructive",
      });
    }
  };

  // Fonctions d'approbation DG
  const handleApproveResponse = async () => {
    if (!workflowData?.correspondance?.id) return;
    
    setApproving(true);
    try {
      console.log('✅ [WorkflowChat] DG approuve la réponse pour:', workflowData.correspondance.id);
      
      // Utiliser la route existante avec draftIndex 0 (premier draft)
      const response = await api.post(`/api/correspondances/workflow/dg-feedback/${workflowData.correspondance.id}/0`, {
        action: 'APPROVE',
        feedback: 'Réponse approuvée par le Directeur Général. La proposition peut être finalisée et envoyée.',
        isApproved: true
      });

      if (response.data.success) {
        toast({
          title: "Réponse approuvée",
          description: "La réponse a été approuvée et peut maintenant être envoyée",
        });
        
        // Recharger les données
        await loadMessages();
        onMessageSent?.();
      }
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur approbation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la réponse",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-lg overflow-hidden">
      {/* En-tête style WhatsApp */}
      <div className="flex items-center p-3 bg-green-600 text-white shadow-md">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Chat Workflow</h3>
            <p className="text-xs text-green-100">
              {messages.length} message{messages.length !== 1 ? 's' : ''} • En ligne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Zone des messages style WhatsApp */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-gray-100" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/svg%3E")`,
           }}>
        <ScrollArea 
          className="flex-1 px-3 py-2"
          onScrollCapture={(e) => {
            const target = e.target as HTMLElement;
            const { scrollTop, scrollHeight, clientHeight } = target;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            
            if (!isAtBottom) {
              setUserHasScrolled(true);
              setShouldAutoScroll(false);
            } else {
              setUserHasScrolled(false);
              setShouldAutoScroll(true);
            }
          }}
        >
          <div className="space-y-2 py-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Chargement des messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun message</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto bg-white rounded-lg p-3 shadow-sm">
                  💬 Commencez la conversation en envoyant le premier message
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isFromCurrentUser = message.from.id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div className={`max-w-[75%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                        {/* Avatar et nom d'utilisateur pour messages reçus */}
                        {!isFromCurrentUser && (
                          <div className="flex items-center mb-1 ml-1">
                            <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs text-white font-medium">
                                {message.from.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{message.from.name}</span>
                            <Badge className={`ml-2 text-xs px-1 py-0 ${getRoleColor(message.from.role)}`}>
                              {message.from.role === 'DIRECTEUR_GENERAL' ? 'DG' : 
                               message.from.role === 'DIRECTEUR' ? 'DIR' : 
                               message.from.role === 'SOUS_DIRECTEUR' ? 'S-DIR' : 'USER'}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Bulle de message style WhatsApp */}
                        <div
                          className={`rounded-lg p-3 shadow-md relative ${
                            isFromCurrentUser
                              ? 'bg-green-500 text-white ml-8'
                              : 'bg-white text-gray-900 mr-8'
                          }`}
                          style={{
                            borderRadius: isFromCurrentUser 
                              ? '18px 18px 4px 18px' 
                              : '18px 18px 18px 4px'
                          }}
                        >
                          {/* Contenu du message */}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>

                          {/* Attachements style WhatsApp */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 mt-2 pt-2 border-t border-opacity-20">
                              {message.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded-lg ${
                                    isFromCurrentUser ? 'bg-green-600 bg-opacity-50' : 'bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={`p-1 rounded ${isFromCurrentUser ? 'bg-green-600' : 'bg-blue-500'}`}>
                                      <FileText className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium truncate">
                                        📎 {attachment.originalName}
                                      </p>
                                      <p className="text-xs opacity-75">
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`ml-2 flex-shrink-0 h-6 w-6 p-0 ${
                                      isFromCurrentUser ? 'text-white hover:bg-green-600' : 'hover:bg-gray-200'
                                    }`}
                                    onClick={() => handleDownloadAttachment(attachment)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp et statut style WhatsApp */}
                          <div className={`flex items-center justify-end mt-2 text-xs ${
                            isFromCurrentUser ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <div className="flex items-center gap-1">
                              <span>{new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                              {isFromCurrentUser && (
                                <div className="flex">
                                  {message.isRead ? (
                                    <div className="flex">
                                      <CheckCircle2 className="h-3 w-3 text-blue-300" />
                                      <CheckCircle2 className="h-3 w-3 text-blue-300 -ml-1" />
                                    </div>
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 text-green-200" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Bouton "Aller en bas" quand l'utilisateur a scrollé */}
        {userHasScrolled && (
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              size="sm"
              onClick={() => {
                setShouldAutoScroll(true);
                setUserHasScrolled(false);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
              title="Aller en bas du chat"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Zone de saisie style WhatsApp */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        {/* Attachements en cours - version compacte */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {attachments.length} fichier{attachments.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded border">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(index)}
                    className="ml-1 h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message d'information si workflow approuvé */}
        {workflowData?.currentStatus === 'DG_APPROVED' && (
          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Réponse Approuvée</h4>
            </div>
            <p className="text-sm text-green-700">
              {user?.role === 'DIRECTEUR' && 
                "Votre proposition a été approuvée par le DG. Le dossier est maintenant transmis au superviseur du bureau d'ordre pour finalisation."
              }
              {user?.role === 'SUPERVISEUR_BUREAU_ORDRE' && 
                "Cette correspondance a été approuvée par le DG. Vous pouvez consulter tout l'historique et finaliser la réponse."
              }
              {user?.role === 'DIRECTEUR_GENERAL' && 
                "Vous avez approuvé cette réponse. Le dossier est transmis au superviseur du bureau d'ordre."
              }
            </p>
          </div>
        )}

        {/* Section d'approbation DG - Version compacte */}
        {(() => {
          // ✅ LOGS ULTRA DÉTAILLÉS POUR DEBUG
          console.log('🔍 [WorkflowChat] === DEBUG SECTION DG ULTRA DÉTAILLÉ ===');
          console.log('🔍 [WorkflowChat] user:', user);
          console.log('🔍 [WorkflowChat] user?.role:', user?.role);
          console.log('🔍 [WorkflowChat] workflowData:', workflowData);
          
          if (workflowData) {
            console.log('🔍 [WorkflowChat] workflowData.currentStatus:', workflowData.currentStatus);
            console.log('🔍 [WorkflowChat] workflowData.correspondance:', workflowData.correspondance);
            
            if (workflowData.correspondance) {
              console.log('🔍 [WorkflowChat] workflowData.correspondance.workflowStatus:', workflowData.correspondance.workflowStatus);
              console.log('🔍 [WorkflowChat] workflowData.correspondance.responseDrafts:', workflowData.correspondance.responseDrafts);
              
              if (workflowData.correspondance.responseDrafts) {
                console.log('🔍 [WorkflowChat] responseDrafts.length:', workflowData.correspondance.responseDrafts.length);
                workflowData.correspondance.responseDrafts.forEach((draft: any, index: number) => {
                  console.log(`🔍 [WorkflowChat] draft[${index}]:`, {
                    status: draft.status,
                    directorName: draft.directorName,
                    isUrgent: draft.isUrgent,
                    createdAt: draft.createdAt
                  });
                });
              }
            }
          }
          
          const condition1 = user?.role === 'DIRECTEUR_GENERAL';
          const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.currentStatus);
          const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.correspondance?.workflowStatus);
          const condition4 = workflowData?.correspondance?.responseDrafts && 
                            workflowData.correspondance.responseDrafts.some((draft: any) => draft.status === 'PENDING_DG_REVIEW');
          
          console.log('🔍 [WorkflowChat] CONDITIONS DÉTAILLÉES:', {
            condition1_userRole: condition1,
            condition2_currentStatus: condition2,
            condition3_corrWorkflowStatus: condition3,
            condition4_pendingDrafts: condition4,
            condition2_details: {
              currentStatus: workflowData?.currentStatus,
              isInArray: ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.currentStatus)
            },
            condition3_details: {
              corrWorkflowStatus: workflowData?.correspondance?.workflowStatus,
              isInArray: ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.correspondance?.workflowStatus)
            },
            condition4_details: {
              hasDrafts: !!workflowData?.correspondance?.responseDrafts,
              draftsCount: workflowData?.correspondance?.responseDrafts?.length || 0,
              pendingDrafts: workflowData?.correspondance?.responseDrafts?.filter((d: any) => d.status === 'PENDING_DG_REVIEW').length || 0
            }
          });
          
          const shouldShow = condition1 && (condition2 || condition3 || condition4);
          
          console.log('🔍 [WorkflowChat] RÉSULTAT FINAL:', {
            shouldShow,
            reason: shouldShow ? 'Toutes conditions remplies' : 'Conditions non remplies'
          });
          
          // ✅ FORÇAGE RETIRÉ - CONDITIONS NORMALES RESTAURÉES
          
          return shouldShow;
        })() && (
          <div className="mb-2 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            {/* Header compact avec statut */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-900">Action DG requise</h4>
              </div>
              
              {/* Badge de statut compact avec mise en évidence */}
              {(workflowData?.currentStatus === 'DIRECTOR_DRAFT' || workflowData?.correspondance?.workflowStatus === 'DIRECTOR_DRAFT') && (
                <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0 animate-pulse">
                  📝 Nouvelle proposition
                </Badge>
              )}
              {(workflowData?.currentStatus === 'DIRECTOR_REVISION' || workflowData?.correspondance?.workflowStatus === 'DIRECTOR_REVISION') && (
                <Badge className="bg-orange-100 text-orange-700 text-xs px-2 py-0 animate-pulse">
                  🔄 En révision
                </Badge>
              )}
              {workflowData?.correspondance?.responseDrafts && workflowData.correspondance.responseDrafts.some((draft: any) => draft.status === 'PENDING_DG_REVIEW') && (
                <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0 animate-bounce">
                  🚨 Action requise
                </Badge>
              )}
            </div>
            
            {/* Actions en ligne */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-3">
                <p className="text-xs text-purple-700">
                  {(workflowData?.currentStatus === 'DIRECTOR_DRAFT' || workflowData?.correspondance?.workflowStatus === 'DIRECTOR_DRAFT') && "Nouvelle proposition disponible"}
                  {(workflowData?.currentStatus === 'DIRECTOR_REVISION' || workflowData?.correspondance?.workflowStatus === 'DIRECTOR_REVISION') && "Révisions en cours"}
                  {workflowData?.correspondance?.responseDrafts && workflowData.correspondance.responseDrafts.some((draft: any) => draft.status === 'PENDING_DG_REVIEW') && "Proposition en attente de votre approbation"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Approuvez ou envoyez vos commentaires ci-dessous
                </p>
                {/* Affichage des propositions reçues */}
                {workflowData?.correspondance?.responseDrafts && workflowData.correspondance.responseDrafts.length > 0 && (
                  <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 mb-1">📋 Propositions reçues :</p>
                    {workflowData.correspondance.responseDrafts.map((draft: any, index: number) => (
                      <div key={index} className={`text-xs p-1 rounded mb-1 ${draft.status === 'PENDING_DG_REVIEW' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                        <span className="font-medium">{draft.directorName}</span>
                        <span className={`ml-2 px-1 rounded text-xs ${draft.status === 'PENDING_DG_REVIEW' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                          {draft.status === 'PENDING_DG_REVIEW' ? '⏳ En attente' : draft.status}
                        </span>
                        {draft.isUrgent && <span className="ml-1 text-red-600">🚨</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Bouton d'approbation compact */}
              <Button
                onClick={() => setShowApprovalModal(true)}
                disabled={approving}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Approuver
              </Button>
            </div>
          </div>
        )}

        {/* Zone de saisie style WhatsApp */}
        {!(workflowData?.currentStatus === 'DG_APPROVED' && (user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR')) ? (
          <div className="flex items-end gap-2">
            {/* Bouton d'attachement */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-200 text-gray-600"
              title="Joindre un fichier"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            {/* Zone de texte */}
            <div className="flex-1 bg-white rounded-full border border-gray-300 shadow-sm">
              <Textarea
                placeholder="Tapez un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[40px] max-h-20 resize-none text-sm border-0 rounded-full px-4 py-2 focus:ring-0 focus:outline-none"
                style={{ boxShadow: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            
            {/* Bouton d'envoi */}
            <Button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && attachments.length === 0)}
              size="sm"
              className="h-10 w-10 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md"
              title="Envoyer"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              {user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR' ? (
                <>
                  ✅ <strong>Votre proposition a été approuvée par le DG.</strong>
                  <br />
                  💼 Le dossier est maintenant transmis au superviseur du bureau d'ordre pour finalisation.
                  <br />
                  <span className="text-xs text-gray-500 mt-1 block">
                    Le chat est désormais fermé pour cette correspondance.
                  </span>
                </>
              ) : (
                "💼 La proposition a été approuvée. Le dossier est maintenant entre les mains du superviseur du bureau d'ordre."
              )}
            </p>
          </div>
        )}

        {/* Aide style WhatsApp */}
        {!(workflowData?.currentStatus === 'DG_APPROVED' && (user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR')) && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            💡 Entrée = envoyer • Shift+Entrée = nouvelle ligne
          </div>
        )}
      </div>

      {/* Modale d'approbation DG */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Approuver la réponse</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {newMessage.trim() || attachments.length > 0 ? (
                <>
                  <strong>Message et/ou pièces jointes détectés dans le chat :</strong>
                  <br />
                  Ils seront envoyés avec l'approbation.
                </>
              ) : (
                "Confirmer l'approbation de cette réponse."
              )}
            </p>
            
            {/* Aperçu du message à envoyer */}
            {newMessage.trim() && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Message à envoyer :</p>
                <p className="text-sm text-gray-600 italic">"{newMessage}"</p>
              </div>
            )}
            
            {/* Aperçu des attachements */}
            {attachments.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Pièces jointes à envoyer :</p>
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  setApproving(true);
                  try {
                    // Envoyer le message avec attachements s'il y en a
                    if (newMessage.trim() || attachments.length > 0) {
                      await sendMessageWithAttachments(
                        newMessage.trim() || "✅ Réponse approuvée par le Directeur Général",
                        attachments
                      );
                      
                      // Vider la zone de saisie après envoi
                      setNewMessage('');
                      setAttachments([]);
                    }
                    
                    // Puis approuver
                    await handleApproveResponse();
                    
                    setShowApprovalModal(false);
                  } catch (error) {
                    console.error('Erreur approbation:', error);
                  } finally {
                    setApproving(false);
                  }
                }}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {approving ? 'Approbation...' : 'Approuver'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkflowChatPanel;
