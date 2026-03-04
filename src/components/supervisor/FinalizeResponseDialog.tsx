import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Paperclip,
  FileText,
  Download,
  X,
  Mail,
  Truck,
  User,
  MapPin,
  Archive,
  CheckCircle,
  MessageSquare,
  Crown,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface FinalizeResponseDialogProps {
  correspondanceId: string;
  correspondanceData: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface DischargeFile {
  file: File;
  name: string;
  size: number;
  type: string;
  category: string;
  description: string;
}

export const FinalizeResponseDialog: React.FC<FinalizeResponseDialogProps> = ({
  correspondanceId,
  correspondanceData,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dischargeInputRef = useRef<HTMLInputElement>(null);

  const [finalResponseContent, setFinalResponseContent] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('EMAIL');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Champs supplémentaires pour la correspondance sortante
  const [outgoingSubject, setOutgoingSubject] = useState('');
  const [outgoingCode, setOutgoingCode] = useState('');
  const [outgoingPriority, setOutgoingPriority] = useState('MEDIUM');
  const [outgoingTags, setOutgoingTags] = useState<string[]>([]);
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [dischargeFiles, setDischargeFiles] = useState<DischargeFile[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Récupérer le contenu approuvé par le DG
  const approvedDraft = correspondanceData?.responseDrafts?.find(
    (draft: any) => draft.status === 'APPROVED' || 
    draft.dgFeedbacks?.some((feedback: any) => feedback.action === 'APPROVE')
  );

  // Charger l'historique du chat
  const loadChatHistory = async () => {
    if (!correspondanceId) return;
    
    setIsLoadingChat(true);
    try {
      console.log('🔄 [FinalizeDialog] Chargement historique chat pour:', correspondanceId);
      
      const response = await api.get(`/api/workflow-chat/by-correspondance/${correspondanceId}`);
      if (response.data.success && response.data.data) {
        const workflowId = response.data.data._id;
        console.log('🔄 [FinalizeDialog] Workflow trouvé:', workflowId);
        
        const messagesResponse = await api.get(`/api/workflow-chat/${workflowId}/messages`);
        if (messagesResponse.data.success) {
          const messagesData = messagesResponse.data.data;
          console.log('📨 [FinalizeDialog] Messages reçus:', messagesData);
          
          // Le backend retourne les messages dans messagesData.chatMessages
          const messages = messagesData.chatMessages || [];
          console.log('💬 [FinalizeDialog] Messages extraits:', messages.length);
          
          // Adapter le format des messages pour l'affichage
          const adaptedMessages = messages.map((message: any) => ({
            ...message,
            fromName: message.from?.name || 'Utilisateur inconnu',
            fromRole: message.from?.role || 'UNKNOWN',
            toName: message.to?.name || 'Destinataire inconnu',
            toRole: message.to?.role || 'UNKNOWN'
          }));
          
          console.log('✅ [FinalizeDialog] Messages adaptés:', adaptedMessages);
          setChatHistory(adaptedMessages);
        }
      }
    } catch (error) {
      console.error('❌ [FinalizeDialog] Erreur chargement chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  React.useEffect(() => {
    if (approvedDraft) {
      setFinalResponseContent(approvedDraft.responseContent || '');
    }
    if (correspondanceData?.from_address) {
      setRecipientEmail(correspondanceData.from_address);
    }
    
    // Initialiser les champs de la correspondance sortante
    if (correspondanceData) {
      setOutgoingSubject(`RE: ${correspondanceData.subject || correspondanceData.title || ''}`);
      setOutgoingCode(`REP-${correspondanceData.code || new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
      setOutgoingPriority(correspondanceData.priority || 'MEDIUM');
      setOutgoingTags(correspondanceData.tags || []);
    }
    
    // Charger l'historique du chat quand le dialogue s'ouvre
    if (isOpen) {
      loadChatHistory();
    }
  }, [approvedDraft, correspondanceData, isOpen, correspondanceId]);

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDischargeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newDischargeFiles = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      category: 'DELIVERY_RECEIPT',
      description: ''
    }));
    setDischargeFiles(prev => [...prev, ...newDischargeFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeDischargeFile = (index: number) => {
    setDischargeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDischargeFileCategory = (index: number, category: string) => {
    setDischargeFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, category } : file
    ));
  };

  const updateDischargeFileDescription = (index: number, description: string) => {
    setDischargeFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, description } : file
    ));
  };

  const uploadFiles = async (files: File[], type: 'response' | 'discharge'): Promise<string[]> => {
    const uploadedFiles: string[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('correspondanceId', correspondanceId);
      formData.append('type', type);
      
      try {
        const response = await api.post('/api/uploads/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.fileName) {
          uploadedFiles.push(response.data.fileName);
        }
      } catch (error) {
        console.error('Erreur upload fichier:', error);
        toast({
          title: 'Erreur upload',
          description: `Impossible d'uploader ${file.name}`,
          variant: 'destructive'
        });
      }
    }
    
    return uploadedFiles;
  };

  const handleSubmit = async () => {
    if (!finalResponseContent.trim()) {
      toast({
        title: 'Contenu requis',
        description: 'Veuillez saisir le contenu de la réponse',
        variant: 'destructive'
      });
      return;
    }

    if (deliveryMethod === 'EMAIL' && !recipientEmail.trim()) {
      toast({
        title: 'Email requis',
        description: 'Veuillez saisir l\'email du destinataire',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload des fichiers
      const uploadedAttachments = await uploadFiles(
        attachments.map(a => a.file), 
        'response'
      );

      // Préparer les données de finalisation
      const finalData = {
        finalResponseContent,
        attachments: uploadedAttachments.map((fileName, index) => ({
          name: attachments[index]?.name || fileName,
          path: fileName,
          size: attachments[index]?.size || 0,
          type: attachments[index]?.type || 'application/octet-stream'
        })),
        deliveryMethod,
        recipientEmail: deliveryMethod === 'EMAIL' ? recipientEmail : undefined,
        recipientAddress: deliveryMethod !== 'EMAIL' ? recipientAddress : undefined,
        trackingNumber: trackingNumber || undefined,
        deliveryNotes: deliveryNotes || undefined,
        
        // Informations pour la correspondance sortante
        outgoingCorrespondance: {
          subject: outgoingSubject,
          code: outgoingCode,
          priority: outgoingPriority,
          tags: outgoingTags
        }
      };

      // Finaliser la réponse
      const response = await api.post(
        `/api/correspondances/workflow/finalize/${correspondanceId}`,
        finalData
      );

      if (response.data.success) {
        toast({
          title: 'Réponse finalisée',
          description: 'La réponse a été envoyée avec succès',
          variant: 'default'
        });
        
        onSuccess();
        onClose();
      }
      
    } catch (error: any) {
      console.error('Erreur finalisation:', error);
      toast({
        title: 'Erreur de finalisation',
        description: error.response?.data?.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Finaliser et envoyer la réponse</span>
          </DialogTitle>
          <DialogDescription>
            {correspondanceData?.title} • Approuvée par le DG
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Historique du chat et réponse approuvée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Historique des échanges</span>
                {approvedDraft && (
                  <Badge className="bg-green-100 text-green-800">
                    <Crown className="w-3 h-3 mr-1" />
                    Approuvé par le DG
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingChat ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
                </div>
              ) : chatHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chatHistory.map((message, index) => (
                    <div key={index} className="p-3 rounded-lg border-l-4 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm">{message.fromName || 'Utilisateur'}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.fromRole === 'DIRECTEUR_GENERAL' ? 'DG' : 
                             message.fromRole === 'DIRECTEUR' ? 'DIR' : 
                             message.fromRole === 'SOUS_DIRECTEUR' ? 'S-DIR' : message.fromRole}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(message.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun historique de chat disponible</p>
                </div>
              )}
              
              {/* Réponse approuvée mise en évidence */}
              {approvedDraft && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Réponse approuvée par le DG</span>
                    <Badge className="bg-green-600 text-white">
                      {approvedDraft.directorName}
                    </Badge>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-300">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {approvedDraft.responseContent}
                    </p>
                  </div>
                  {approvedDraft.dgFeedbacks?.map((feedback: any, idx: number) => (
                    feedback.action === 'APPROVE' && (
                      <div key={idx} className="mt-2 p-2 bg-green-100 rounded text-sm">
                        <strong className="text-green-800">Commentaire DG :</strong>
                        <p className="text-green-700 mt-1">{feedback.feedback || 'Approuvé sans commentaire'}</p>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contenu de la réponse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Contenu de la réponse</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Approuvé par le DG
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={finalResponseContent}
                onChange={(e) => setFinalResponseContent(e.target.value)}
                placeholder="Contenu de la réponse finale..."
                rows={6}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Méthode de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Méthode de livraison</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deliveryMethod">Méthode de livraison</Label>
                <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="POSTAL">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Courrier postal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HAND_DELIVERY">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Remise en main propre</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="COURIER">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4" />
                        <span>Coursier</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deliveryMethod === 'EMAIL' && (
                <div>
                  <Label htmlFor="recipientEmail">Email du destinataire</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="destinataire@example.com"
                  />
                </div>
              )}

              {deliveryMethod !== 'EMAIL' && (
                <div>
                  <Label htmlFor="recipientAddress">Adresse du destinataire</Label>
                  <Textarea
                    id="recipientAddress"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Adresse complète du destinataire..."
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trackingNumber">Numéro de suivi (optionnel)</Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Numéro de suivi..."
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryNotes">Notes de livraison</Label>
                  <Input
                    id="deliveryNotes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations de la correspondance sortante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Informations de la correspondance sortante</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outgoingSubject">Objet de la réponse</Label>
                  <Input
                    id="outgoingSubject"
                    value={outgoingSubject}
                    onChange={(e) => setOutgoingSubject(e.target.value)}
                    placeholder="RE: Objet de la correspondance..."
                  />
                </div>
                <div>
                  <Label htmlFor="outgoingCode">Code de référence</Label>
                  <Input
                    id="outgoingCode"
                    value={outgoingCode}
                    onChange={(e) => setOutgoingCode(e.target.value)}
                    placeholder="REP-2025-XXXX"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="outgoingPriority">Priorité de la réponse</Label>
                <Select value={outgoingPriority} onValueChange={setOutgoingPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Élevée</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pièces jointes de la réponse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5" />
                <span>Pièces jointes de la réponse</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Ajouter des pièces jointes
              </Button>
              
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finalisation...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finaliser et envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
