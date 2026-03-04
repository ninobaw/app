import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Send, 
  Save, 
  AlertTriangle, 
  Clock, 
  User,
  Building,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface ResponseDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  correspondance: any;
  onDraftSubmitted?: () => void;
}

interface DraftData {
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedResponseTime: string;
  requiredApprovals: string[];
  notes: string;
  attachments: File[];
}

export const ResponseDraftDialog: React.FC<ResponseDraftDialogProps> = ({
  isOpen,
  onClose,
  correspondance,
  onDraftSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [draftData, setDraftData] = useState<DraftData>({
    content: '',
    priority: 'MEDIUM',
    estimatedResponseTime: '3',
    requiredApprovals: ['DIRECTEUR_GENERAL'],
    notes: '',
    attachments: []
  });

  // Vérifier si l'utilisateur peut créer un draft
  const canCreateDraft = user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR';

  const handleSubmitDraft = async () => {
    if (!draftData.content.trim()) {
      toast({
        title: "Erreur",
        description: "Le contenu du draft est obligatoire",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const draftPayload = {
        correspondanceId: correspondance._id,
        content: draftData.content,
        priority: draftData.priority,
        estimatedResponseTime: parseInt(draftData.estimatedResponseTime),
        requiredApprovals: draftData.requiredApprovals,
        notes: draftData.notes,
        status: 'DRAFT_PENDING',
        submittedBy: user?.id,
        submittedAt: new Date().toISOString()
      };

      console.log('📝 Soumission draft:', draftPayload);

      const response = await api.post('/api/correspondances/response-draft', draftPayload);

      if (response.data.success) {
        toast({
          title: "Draft soumis",
          description: "Votre draft de réponse a été soumis au Directeur Général pour approbation",
          variant: "default"
        });

        onDraftSubmitted?.();
        onClose();
        
        // Réinitialiser le formulaire
        setDraftData({
          content: '',
          priority: 'MEDIUM',
          estimatedResponseTime: '3',
          requiredApprovals: ['DIRECTEUR_GENERAL'],
          notes: '',
          attachments: []
        });
      }
    } catch (error: any) {
      console.error('Erreur soumission draft:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la soumission du draft",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      const draftPayload = {
        correspondanceId: correspondance._id,
        content: draftData.content,
        priority: draftData.priority,
        estimatedResponseTime: parseInt(draftData.estimatedResponseTime),
        notes: draftData.notes,
        status: 'DRAFT_SAVED',
        submittedBy: user?.id
      };

      const response = await api.post('/api/correspondances/save-draft', draftPayload);

      if (response.data.success) {
        toast({
          title: "Draft sauvegardé",
          description: "Votre draft a été sauvegardé. Vous pouvez le modifier plus tard.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde draft:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du draft",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateDraft) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Accès non autorisé
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600">
              Seuls les directeurs et sous-directeurs peuvent créer des drafts de réponse.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <MessageSquare className="w-5 h-5 mr-2" />
            Draft de Réponse - {correspondance?.subject}
          </DialogTitle>
          <DialogDescription>
            Préparez votre draft de réponse qui sera soumis au Directeur Général pour approbation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la correspondance */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Correspondance Originale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">De:</span>
                  <span className="ml-1">{correspondance?.from_address}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Reçue:</span>
                  <span className="ml-1">
                    {correspondance?.createdAt ? new Date(correspondance.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Aéroport:</span>
                  <span className="ml-1">{correspondance?.airport}</span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Priorité:</span>
                  <Badge variant={correspondance?.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                    {correspondance?.priority}
                  </Badge>
                </div>
              </div>
              {correspondance?.response_deadline && (
                <div className="flex items-center text-sm mt-2 p-2 bg-orange-50 rounded">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="font-medium text-orange-700">Échéance:</span>
                  <span className="ml-1 text-orange-600">
                    {new Date(correspondance.response_deadline).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contenu du draft */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="content" className="text-sm font-medium">
                Contenu de la Réponse *
              </Label>
              <Textarea
                id="content"
                placeholder="Rédigez votre réponse ici..."
                value={draftData.content}
                onChange={(e) => setDraftData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[200px] mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce contenu sera soumis au Directeur Général pour validation avant envoi
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priorité de la Réponse
                </Label>
                <Select 
                  value={draftData.priority} 
                  onValueChange={(value: any) => setDraftData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
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

              <div>
                <Label htmlFor="estimatedTime" className="text-sm font-medium">
                  Temps Estimé (jours)
                </Label>
                <Select 
                  value={draftData.estimatedResponseTime} 
                  onValueChange={(value) => setDraftData(prev => ({ ...prev, estimatedResponseTime: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour</SelectItem>
                    <SelectItem value="2">2 jours</SelectItem>
                    <SelectItem value="3">3 jours</SelectItem>
                    <SelectItem value="5">5 jours</SelectItem>
                    <SelectItem value="7">1 semaine</SelectItem>
                    <SelectItem value="14">2 semaines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes Internes (Optionnel)
              </Label>
              <Textarea
                id="notes"
                placeholder="Notes pour le Directeur Général (contexte, recommandations, etc.)"
                value={draftData.notes}
                onChange={(e) => setDraftData(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[100px] mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ces notes ne seront pas incluses dans la réponse finale
              </p>
            </div>
          </div>

          {/* Informations sur le processus */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-medium text-blue-800 mb-1">Processus d'Approbation</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Votre draft sera soumis au Directeur Général</li>
                    <li>• Le DG peut approuver, demander des modifications ou rejeter</li>
                    <li>• Vous recevrez une notification de la décision</li>
                    <li>• Une fois approuvé, la réponse sera envoyée automatiquement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button 
              onClick={handleSaveDraft} 
              variant="outline"
              disabled={loading}
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitDraft} 
              disabled={loading || !draftData.content.trim()}
              className="flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Soumission...' : 'Soumettre au DG'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
