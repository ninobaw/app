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
  MessageSquare,
  X
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

const WorkflowChatPanel: React.FC<WorkflowChatPanelProps> = ({
  workflowId,
  onMessageSent
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les messages
  const loadMessages = async () => {
    try {
      console.log('🔄 [WorkflowChat] Rechargement messages pour workflow:', workflowId);
      const response = await api.get(`/api/workflow-chat/${workflowId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data.chatMessages || []);
        console.log('📨 [WorkflowChat] Messages chargés:', response.data.data.chatMessages?.length || 0);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      console.log('📥 [WorkflowChat] Téléchargement fichier:', attachment);
      
      const possibleUrls = [
        `/api/files/download/${attachment.filename}`,
        `/api/upload/download/${attachment.filename}`,
        `/api/workflow-chat/download/${attachment.filename}`,
        attachment.path ? `/api/files/serve/${attachment.path.split('/').pop()}` : null
      ].filter(Boolean);
      
      let success = false;
      
      for (const downloadUrl of possibleUrls as string[]) {
        try {
          const response = await api.get(downloadUrl, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', attachment.originalName || attachment.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          success = true;
          break;
        } catch (urlError) {
          continue;
        }
      }
      
      if (!success) {
        throw new Error('Aucune URL de téléchargement fonctionnelle trouvée');
      }
    } catch (error) {
      console.error('❌ [WorkflowChat] Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm">
      {/* En-tête du chat optimisé */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chat Workflow</h3>
            <p className="text-sm text-gray-600">Communication en temps réel</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Zone des messages avec scroll optimisé */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Chargement des messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Commencez la conversation en envoyant le premier message. 
                  Tous les échanges seront visibles en temps réel.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isFromCurrentUser = message.from.id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-[75%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                        {/* Avatar et nom (pour les messages des autres) */}
                        {!isFromCurrentUser && (
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mr-2">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{message.from.name}</span>
                            <Badge className={`ml-2 text-xs ${getRoleColor(message.from.role)}`}>
                              {message.from.role}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Bulle de message */}
                        <div
                          className={`rounded-2xl p-4 shadow-sm ${
                            isFromCurrentUser
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {/* Contenu du message */}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>

                          {/* Attachements */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-opacity-20">
                              {message.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    isFromCurrentUser ? 'bg-blue-500 bg-opacity-50' : 'bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium truncate">
                                        {attachment.originalName}
                                      </p>
                                      <p className="text-xs opacity-75">
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`ml-2 flex-shrink-0 ${
                                      isFromCurrentUser ? 'text-white hover:bg-blue-400' : 'hover:bg-gray-200'
                                    }`}
                                    onClick={() => handleDownloadAttachment(attachment)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp et statut */}
                          <div className={`flex items-center justify-between mt-3 pt-2 border-t border-opacity-20 text-xs ${
                            isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(message.timestamp).toLocaleString('fr-FR')}
                            </div>
                            {message.isRead && isFromCurrentUser && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Lu</span>
                              </div>
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
      </div>

      <Separator />

      {/* Zone de saisie optimisée */}
      <div className="p-4 bg-gray-50 rounded-b-lg">
        {/* Attachements en cours */}
        {attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Paperclip className="h-4 w-4" />
              Fichiers à envoyer ({attachments.length})
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(index)}
                    className="ml-2 flex-shrink-0 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie du message */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              className="h-10 w-10 p-0"
              title="Joindre des fichiers"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && attachments.length === 0)}
              size="sm"
              className="h-10 w-10 p-0"
              title="Envoyer le message"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Aide */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Entrée pour envoyer • Shift+Entrée pour nouvelle ligne • Glissez-déposez des fichiers
        </div>
      </div>
    </div>
  );
};

export default WorkflowChatPanel;
