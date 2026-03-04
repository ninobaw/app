import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, User, Calendar } from 'lucide-react';
import { useCorrespondances, CorrespondanceData } from '@/hooks/useCorrespondances';
import { useToast } from '@/hooks/use-toast';

interface InformatifCorrespondanceTrackerProps {
  correspondance: CorrespondanceData;
}

export const InformatifCorrespondanceTracker: React.FC<InformatifCorrespondanceTrackerProps> = ({ 
  correspondance 
}) => {
  const { updateCorrespondance, isUpdating } = useCorrespondances();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    informationTransmittedTo: correspondance.informationTransmittedTo || '',
    informationActions: correspondance.informationActions || '',
    informationAcknowledged: correspondance.informationAcknowledged || false,
  });

  const handleSave = async () => {
    try {
      await updateCorrespondance({
        id: correspondance._id || correspondance.id,
        ...formData,
      });
      
      toast({
        title: 'Suivi mis à jour',
        description: 'Les informations de suivi ont été mises à jour avec succès.',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le suivi.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    if (correspondance.informationAcknowledged) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (correspondance.informationTransmittedTo) {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = () => {
    if (correspondance.informationAcknowledged) {
      return 'Information traitée';
    }
    if (correspondance.informationTransmittedTo) {
      return 'En attente de traitement';
    }
    return 'Non transmise';
  };

  const getStatusColor = () => {
    if (correspondance.informationAcknowledged) {
      return 'bg-green-100 text-green-800';
    }
    if (correspondance.informationTransmittedTo) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Suivi Correspondance Informative
          </span>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-gray-600">Objet</Label>
            <p className="text-sm">{correspondance.subject}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Date de réception</Label>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(correspondance.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Suivi de transmission */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="informationTransmittedTo">Information transmise à *</Label>
              <Input
                id="informationTransmittedTo"
                value={formData.informationTransmittedTo}
                onChange={(e) => setFormData({ ...formData, informationTransmittedTo: e.target.value })}
                placeholder="Nom de la personne ou service destinataire"
              />
            </div>
            
            <div>
              <Label htmlFor="informationActions">Actions entreprises</Label>
              <Textarea
                id="informationActions"
                value={formData.informationActions}
                onChange={(e) => setFormData({ ...formData, informationActions: e.target.value })}
                placeholder="Décrivez les actions prises suite à cette information"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="informationAcknowledged"
                checked={formData.informationAcknowledged}
                onChange={(e) => setFormData({ ...formData, informationAcknowledged: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="informationAcknowledged">
                L'information a été prise en compte et les actions appropriées ont été entreprises
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    informationTransmittedTo: correspondance.informationTransmittedTo || '',
                    informationActions: correspondance.informationActions || '',
                    informationAcknowledged: correspondance.informationAcknowledged || false,
                  });
                }}
                disabled={isUpdating}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isUpdating || !formData.informationTransmittedTo.trim()}
              >
                {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Information transmise à</Label>
              <p className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                {correspondance.informationTransmittedTo || 'Non renseigné'}
              </p>
            </div>
            
            {correspondance.informationActions && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Actions entreprises</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {correspondance.informationActions}
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {correspondance.informationAcknowledged ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm">
                  {correspondance.informationAcknowledged 
                    ? 'Information traitée et actions entreprises' 
                    : 'En attente de traitement'
                  }
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Modifier le suivi
              </Button>
            </div>
          </div>
        )}
        
        {/* Alerte si information non traitée depuis plus de 7 jours */}
        {!correspondance.informationAcknowledged && 
         new Date().getTime() - new Date(correspondance.created_at).getTime() > 7 * 24 * 60 * 60 * 1000 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Attention: Cette information n'a pas été traitée depuis plus de 7 jours
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
