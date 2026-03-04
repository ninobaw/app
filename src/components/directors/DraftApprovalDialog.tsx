import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  MessageSquare, 
  User, 
  Calendar, 
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { formatDate } from '@/shared/utils';

interface DraftApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draft: any;
  onDraftProcessed?: () => void;
}

export const DraftApprovalDialog: React.FC<DraftApprovalDialogProps> = ({
  isOpen,
  onClose,
  draft,
  onDraftProcessed
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [comments, setComments] = useState('');

  const handleApprove = async () => {
    if (!draft?._id) return;
    
    setLoading(true);
    try {
      await api.post(`/api/correspondances/approve-draft/${draft._id}`, {
        comments: comments.trim()
      });

      toast({
        title: "Draft approuvé",
        description: "Le draft de réponse a été approuvé et la réponse sera envoyée.",
      });

      onDraftProcessed?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'approbation du draft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!draft?._id || !comments.trim()) {
      toast({
        title: "Commentaire requis",
        description: "Veuillez fournir une raison pour le rejet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/correspondances/reject-draft/${draft._id}`, {
        comments: comments.trim()
      });

      toast({
        title: "Draft rejeté",
        description: "Le draft de réponse a été rejeté avec vos commentaires.",
      });

      onDraftProcessed?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors du rejet du draft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!draft?._id || !comments.trim()) {
      toast({
        title: "Commentaire requis",
        description: "Veuillez fournir des instructions pour la révision.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/correspondances/request-revision/${draft._id}`, {
        comments: comments.trim()
      });

      toast({
        title: "Révision demandée",
        description: "Le directeur a été notifié des modifications à apporter.",
      });

      onDraftProcessed?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la demande de révision",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT_PENDING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRAFT_APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT_REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'DRAFT_NEEDS_REVISION': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!draft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Approbation Draft de Réponse
          </DialogTitle>
          <DialogDescription>
            Examinez et approuvez le draft de réponse préparé par le directeur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du draft */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Informations du Draft
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Soumis par</Label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{draft.submittedBy?.firstName} {draft.submittedBy?.lastName}</span>
                    <Badge variant="outline">{draft.submittedBy?.role}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Date de soumission</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{formatDate(draft.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Priorité</Label>
                  <Badge className={getPriorityColor(draft.priority)}>
                    {draft.priority}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <Badge className={getStatusColor(draft.status)}>
                    {draft.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Temps estimé</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{draft.estimatedResponseTime} jours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Correspondance originale */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Correspondance Originale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Sujet</Label>
                <p className="text-sm">{draft.correspondanceId?.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">De</Label>
                <p className="text-sm">{draft.correspondanceId?.from_address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Contenu (extrait)</Label>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                  {draft.correspondanceId?.content?.substring(0, 200)}...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Draft de réponse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Draft de Réponse Proposé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Contenu de la réponse</Label>
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="text-sm whitespace-pre-wrap">{draft.content}</p>
                </div>
              </div>
              
              {draft.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes internes du directeur</Label>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {draft.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Section d'action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Action du Directeur Général</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!action && (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setAction('approve')} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button 
                    onClick={() => setAction('revision')} 
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Demander Révision
                  </Button>
                  <Button 
                    onClick={() => setAction('reject')} 
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}

              {action && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {action === 'approve' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {action === 'revision' && <Edit3 className="w-4 h-4 text-orange-600" />}
                    {action === 'reject' && <XCircle className="w-4 h-4 text-red-600" />}
                    Action sélectionnée: {
                      action === 'approve' ? 'Approbation' :
                      action === 'revision' ? 'Demande de révision' : 'Rejet'
                    }
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">
                      {action === 'approve' ? 'Commentaires (optionnel)' : 
                       action === 'revision' ? 'Instructions pour la révision *' : 
                       'Raison du rejet *'}
                    </Label>
                    <Textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={
                        action === 'approve' ? 'Commentaires pour le directeur...' :
                        action === 'revision' ? 'Précisez les modifications à apporter...' :
                        'Expliquez pourquoi ce draft est rejeté...'
                      }
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={
                        action === 'approve' ? handleApprove :
                        action === 'revision' ? handleRequestRevision :
                        handleReject
                      }
                      disabled={loading || (action !== 'approve' && !comments.trim())}
                      className={
                        action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                        action === 'revision' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-red-600 hover:bg-red-700'
                      }
                    >
                      {loading ? 'Traitement...' : 
                       action === 'approve' ? 'Confirmer Approbation' :
                       action === 'revision' ? 'Envoyer Instructions' :
                       'Confirmer Rejet'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setAction(null);
                        setComments('');
                      }}
                      variant="outline"
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
