import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Mail, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Upload,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/shared/utils';
import type { CorrespondanceData } from '@/hooks/useCorrespondances';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface CreateResponseDialogProps {
  originalCorrespondance: CorrespondanceData | null;
  isOpen: boolean;
  onClose: () => void;
  onResponseCreated?: (response: any) => void;
}

export const CreateResponseDialog: React.FC<CreateResponseDialogProps> = ({
  originalCorrespondance,
  isOpen,
  onClose,
  onResponseCreated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    to_address: '',
    attachments: [] as File[],
  });

  React.useEffect(() => {
    if (originalCorrespondance && isOpen) {
      // Pré-remplir le formulaire avec les données de la correspondance originale
      setFormData({
        subject: `RE: ${originalCorrespondance.subject}`,
        content: '',
        to_address: originalCorrespondance.from_address,
        attachments: [],
      });
    }
  }, [originalCorrespondance, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalCorrespondance || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Créer FormData pour gérer les fichiers
      const submitData = new FormData();
      
      // Ajouter les données de base
      submitData.append('title', formData.subject);
      submitData.append('subject', formData.subject);
      submitData.append('content', formData.content);
      submitData.append('to_address', formData.to_address);
      submitData.append('from_address', user.email || '');
      submitData.append('type', 'OUTGOING');
      submitData.append('priority', originalCorrespondance.priority);
      submitData.append('airport', originalCorrespondance.airport);
      submitData.append('isResponse', 'true');
      submitData.append('originalCorrespondanceId', originalCorrespondance._id || originalCorrespondance.id);
      
      // Ajouter les fichiers
      formData.attachments.forEach((file, index) => {
        submitData.append(`attachments`, file);
      });

      // Appeler l'endpoint de création de réponse
      const response = await api.post(
        `${API_ENDPOINTS.correspondances}/${originalCorrespondance._id || originalCorrespondance.id}/create-response`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Réponse créée avec succès",
          description: "La correspondance de réponse a été créée et envoyée.",
        });

        if (onResponseCreated) {
          onResponseCreated(response.data.data);
        }

        onClose();
        
        // Réinitialiser le formulaire
        setFormData({
          subject: '',
          content: '',
          to_address: '',
          attachments: [],
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la réponse:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de créer la réponse.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!originalCorrespondance) return null;

  const canCreateResponse = user?.role === 'SUPERVISEUR_BUREAU_ORDRE' || 
                           user?.role === 'SUPER_ADMIN' || 
                           user?.role === 'ADMINISTRATOR';

  if (!canCreateResponse) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Accès non autorisé
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Seuls les superviseurs du bureau d'ordre peuvent créer des réponses officielles aux correspondances.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Send className="w-6 h-6 text-aviation-sky" />
            Créer une Réponse Officielle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Correspondance originale */}
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                <ArrowDownLeft className="w-4 h-4" />
                Correspondance Originale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Objet :</p>
                  <p className="text-sm text-blue-700">{originalCorrespondance.subject}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {originalCorrespondance.priority}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-800">De :</p>
                  <p className="text-sm text-blue-700">{originalCorrespondance.from_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Date :</p>
                  <p className="text-sm text-blue-700">{formatDate(originalCorrespondance.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de réponse */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  Réponse Officielle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Destinataire */}
                <div className="space-y-2">
                  <Label htmlFor="to_address">Destinataire *</Label>
                  <Input
                    id="to_address"
                    type="email"
                    value={formData.to_address}
                    onChange={(e) => handleInputChange('to_address', e.target.value)}
                    placeholder="Adresse email du destinataire"
                    required
                  />
                </div>

                {/* Objet */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Objet *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Objet de la réponse"
                    required
                  />
                </div>

                {/* Contenu */}
                <div className="space-y-2">
                  <Label htmlFor="content">Contenu de la réponse *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Rédigez votre réponse officielle..."
                    rows={8}
                    required
                  />
                </div>

                {/* Upload de fichiers */}
                <div className="space-y-2">
                  <Label htmlFor="attachments">Pièces jointes</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {/* Liste des fichiers attachés */}
                  {formData.attachments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm font-medium">Fichiers attachés :</p>
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Note importante */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Note importante</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Cette réponse sera automatiquement liée à la correspondance originale et marquera celle-ci comme "Répondue". 
                      Une notification sera envoyée aux personnes concernées.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.subject || !formData.content || !formData.to_address}
                className="bg-aviation-sky hover:bg-aviation-sky/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la Réponse
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
