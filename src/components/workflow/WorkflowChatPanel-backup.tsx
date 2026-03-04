import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  Download, 
  FileText, 
  User, 
  Clock,
  CheckCircle2,
  MessageSquare
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
    path: string;
    size: number;
    mimetype: string;
  }>;
  timestamp: string;
  isRead: boolean;
}

interface CorrespondanceInfo {
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
}

const WorkflowChatPanel: React.FC<WorkflowChatPanelProps> = ({ workflowId, onMessageSent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [correspondance, setCorrespondance] = useState<CorrespondanceInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [workflowId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log(`🔄 [WorkflowChat] Rechargement messages pour workflow: ${workflowId}`);
      
      const response = await api.get(`/api/workflow-chat/${workflowId}/messages`);
      
      console.log(`📨 [WorkflowChat] Réponse reçue:`, {
        success: response.data.success,
        messagesCount: response.data.data?.chatMessages?.length || 0,
        workflowStatus: response.data.data?.currentStatus
      });
      
      if (response.data.success) {
        const newMessages = response.data.data.chatMessages || [];
        console.log(`📨 [WorkflowChat] Messages avant mise à jour: ${messages.length}`);
        console.log(`📨 [WorkflowChat] Nouveaux messages: ${newMessages.length}`);
        
        // Comparer avec les messages actuels
        if (newMessages.length !== messages.length) {
          console.log(`⚠️ [WorkflowChat] Changement nombre de messages: ${messages.length} -> ${newMessages.length}`);
        }
        
        setMessages(newMessages);
        setCorrespondance(response.data.data.correspondance);
        
        // Log détaillé des messages
        newMessages.forEach((msg: ChatMessage, index: number) => {
          console.log(`💬 [WorkflowChat] Message ${index + 1}: De ${msg.from.name} vers ${msg.to.name} - ${msg.message.substring(0, 50)}...`);
        });
      }
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur chargement messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message ou ajouter un fichier",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('message', newMessage.trim());
      
      // Ajouter les attachements
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await api.post(`/api/workflow-chat/${workflowId}/send-message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setNewMessage('');
        setAttachments([]);
        await fetchMessages(); // Recharger les messages
        onMessageSent?.();
        
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès",
        });
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const downloadAttachment = async (filename: string, originalName: string) => {
    try {
      console.log(`📥 [WorkflowChat] Téléchargement attachement: ${filename}`);
      console.log(`📥 [WorkflowChat] Nom original: ${originalName}`);
      
      // Utiliser uniquement la route API officielle
      const response = await api.get(`/api/workflow-chat/attachment/${filename}`, {
        responseType: 'blob',
      });
      
      console.log(`✅ [WorkflowChat] Fichier téléchargé avec succès`);
      
      if (!response || !response.data) {
        throw new Error(`Fichier non trouvé: ${filename}`);
      }
      
      // Créer le blob et télécharger
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: `Fichier ${originalName || filename} téléchargé avec succès`,
      });
      
    } catch (error: any) {
      console.error('❌ [WorkflowChat] Erreur téléchargement:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le fichier. Vérifiez qu'il existe encore.",
        variant: "destructive"
      });
    }
  };

  const downloadCorrespondanceAttachment = async (filename: string, originalName: string) => {
    try {
      console.log(`📥 Téléchargement PJ correspondance: ${filename}`);
      // Utiliser la route de résolution de fichiers pour les attachements de correspondance
      const response = await api.get(`/uploads/resolve/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur téléchargement correspondance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier de correspondance",
        variant: "destructive"
      });
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

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Chargement du chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Informations de la correspondance originale */}
      {correspondance && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Correspondance Originale
              <Badge className={getPriorityColor(correspondance.priority)}>
                {correspondance.priority}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Sujet:</h4>
              <p className="text-sm">{correspondance.subject}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Contenu:</h4>
              <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{correspondance.content}</p>
              </div>
            </div>

            {correspondance.attachments && correspondance.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Pièces jointes:</h4>
                <div className="space-y-2">
                  {correspondance.attachments.map((attachment, index) => (
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
                        onClick={() => downloadCorrespondanceAttachment(
                          attachment.filename, 
                          attachment.originalName || attachment.filename
                        )}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Créée le {new Date(correspondance.createdAt).toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de chat */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion ({messages.length} messages)
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun message dans cette discussion</p>
                  <p className="text-sm text-gray-400">Commencez la conversation ci-dessous</p>
                </div>
              ) : (
                <>
                  {/* Indicateur de nombre de messages */}
                  <div className="text-center py-2">
                    <Badge variant="outline" className="text-xs">
                      {messages.length} message{messages.length > 1 ? 's' : ''} dans cette discussion
                    </Badge>
                  </div>
                  {messages.map((message) => {
                  const isFromCurrentUser = message.from.id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            isFromCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {/* En-tête du message */}
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold text-sm">{message.from.name}</span>
                            <Badge className={`text-xs ${getRoleColor(message.from.role)}`}>
                              {message.from.role}
                            </Badge>
                            {message.draftVersion && (
                              <Badge variant="outline" className="text-xs">
                                {message.draftVersion}
                              </Badge>
                            )}
                          </div>

                          {/* Contenu du message */}
                          <p className="text-sm whitespace-pre-wrap mb-2">{message.message}</p>

                          {/* Attachements */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {message.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded ${
                                    isFromCurrentUser ? 'bg-blue-500' : 'bg-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      {attachment.originalName}
                                    </span>
                                    <span className="text-xs opacity-75">
                                      ({formatFileSize(attachment.size)})
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={isFromCurrentUser ? 'text-white hover:bg-blue-400' : ''}
                                    onClick={() => downloadAttachment(attachment.filename, attachment.originalName)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className={`flex items-center gap-1 mt-2 text-xs ${
                            isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {new Date(message.timestamp).toLocaleString('fr-FR')}
                            {message.isRead && isFromCurrentUser && (
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                            )}
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

          <Separator />

          {/* Zone de saisie */}
          <div className="p-4 space-y-3">
            {/* Attachements en cours */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Fichiers à envoyer:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAttachment(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Zone de saisie du message */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                  size="sm"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowChatPanel;
