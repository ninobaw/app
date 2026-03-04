import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  User, 
  Calendar,
  Send,
  Save,
  Upload,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ValidatedCorrespondance {
  id: string;
  title: string;
  subject: string;
  priority: string;
  airport: string;
  validatedAt: string;
  validatedBy: string;
  directorComments: string;
  deadline: string;
  responseRequired: boolean;
  urgencyLevel: number;
  originalContent?: string;
  originalSender?: string;
  originalRecipient?: string;
}

interface PrepareResponseDialogProps {
  correspondance: ValidatedCorrespondance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrepareResponseDialog: React.FC<PrepareResponseDialogProps> = ({
  correspondance,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState({
    responseSubject: '',
    responseContent: '',
    responseReference: '',
    attachments: [] as File[],
    estimatedCompletionDate: '',
    assignedTo: '',
    notes: ''
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-blue-500 text-white';
      case 'LOW': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getUrgencyIndicator = (level: number) => {
    if (level >= 8) return { color: 'text-red-600', label: 'Très Urgent' };
    if (level >= 6) return { color: 'text-orange-600', label: 'Urgent' };
    if (level >= 4) return { color: 'text-blue-600', label: 'Important' };
    return { color: 'text-gray-600', label: 'Normal' };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setResponseData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      // Ici, vous feriez l'appel API pour sauvegarder le brouillon
      // await api.post('/supervisor/save-response-draft', { correspondanceId: correspondance?.id, ...responseData });
      
      toast({
        title: "Brouillon sauvegardé",
        description: "La réponse a été sauvegardée en tant que brouillon.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le brouillon.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseData.responseSubject || !responseData.responseContent) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le sujet et le contenu de la réponse.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Ici, vous feriez l'appel API pour soumettre la réponse
      // await api.post('/supervisor/submit-response', { correspondanceId: correspondance?.id, ...responseData });
      
      toast({
        title: "Réponse soumise",
        description: "La réponse a été soumise avec succès pour validation finale.",
      });
      
      onOpenChange(false);
      
      // Reset form
      setResponseData({
        responseSubject: '',
        responseContent: '',
        responseReference: '',
        attachments: [],
        estimatedCompletionDate: '',
        assignedTo: '',
        notes: ''
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la réponse.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!correspondance) return null;

  const urgencyIndicator = getUrgencyIndicator(correspondance.urgencyLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Préparer la Réponse</span>
            <Badge className={getPriorityColor(correspondance.priority)}>
              {correspondance.priority}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la correspondance originale */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Correspondance Validée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-green-700">Titre</Label>
                  <p className="text-sm">{correspondance.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Sujet</Label>
                  <p className="text-sm">{correspondance.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Aéroport</Label>
                  <Badge variant="outline">{correspondance.airport}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Échéance</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {format(new Date(correspondance.deadline), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-700">Commentaires du Directeur</Label>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="flex items-center text-sm text-green-600 mb-1">
                    <User className="w-4 h-4 mr-1" />
                    Validé par: {correspondance.validatedBy}
                  </div>
                  <p className="text-sm text-gray-700">{correspondance.directorComments}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-700">Niveau d'urgence:</span>
                  <span className={`text-sm font-bold ${urgencyIndicator.color}`}>
                    {urgencyIndicator.label} ({correspondance.urgencyLevel}/10)
                  </span>
                </div>
                <div className="text-xs text-green-600">
                  Validé le {format(new Date(correspondance.validatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerte d'échéance */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Attention:</strong> Cette correspondance nécessite une réponse avant le{' '}
              <strong>{format(new Date(correspondance.deadline), 'dd/MM/yyyy à HH:mm', { locale: fr })}</strong>.
              Préparez votre réponse rapidement pour respecter les délais.
            </AlertDescription>
          </Alert>

          {/* Formulaire de réponse */}
          <Card>
            <CardHeader>
              <CardTitle>Préparation de la Réponse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sujet de la réponse */}
              <div>
                <Label htmlFor="responseSubject">Sujet de la réponse *</Label>
                <Input
                  id="responseSubject"
                  value={responseData.responseSubject}
                  onChange={(e) => setResponseData(prev => ({ ...prev, responseSubject: e.target.value }))}
                  placeholder={`RE: ${correspondance.subject}`}
                  className="mt-1"
                />
              </div>

              {/* Référence de réponse */}
              <div>
                <Label htmlFor="responseReference">Référence de réponse</Label>
                <Input
                  id="responseReference"
                  value={responseData.responseReference}
                  onChange={(e) => setResponseData(prev => ({ ...prev, responseReference: e.target.value }))}
                  placeholder="REF-2024-001"
                  className="mt-1"
                />
              </div>

              {/* Contenu de la réponse */}
              <div>
                <Label htmlFor="responseContent">Contenu de la réponse *</Label>
                <Textarea
                  id="responseContent"
                  value={responseData.responseContent}
                  onChange={(e) => setResponseData(prev => ({ ...prev, responseContent: e.target.value }))}
                  placeholder="Rédigez votre réponse ici..."
                  rows={8}
                  className="mt-1"
                />
              </div>

              {/* Assignation et date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedTo">Assigné à</Label>
                  <Input
                    id="assignedTo"
                    value={responseData.assignedTo}
                    onChange={(e) => setResponseData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="Nom du responsable"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedCompletionDate">Date d'achèvement estimée</Label>
                  <Input
                    id="estimatedCompletionDate"
                    type="datetime-local"
                    value={responseData.estimatedCompletionDate}
                    onChange={(e) => setResponseData(prev => ({ ...prev, estimatedCompletionDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Pièces jointes */}
              <div>
                <Label>Pièces jointes</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des fichiers
                  </Button>
                </div>
                
                {responseData.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {responseData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes internes */}
              <div>
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  value={responseData.notes}
                  onChange={(e) => setResponseData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes pour le suivi interne..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder Brouillon
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Soumission...' : 'Soumettre Réponse'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
