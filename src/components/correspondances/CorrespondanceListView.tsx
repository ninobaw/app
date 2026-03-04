import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Reply, Users } from 'lucide-react';
import { CorrespondanceData } from '@/hooks/useCorrespondances';
import { CorrespondanceReplyButton } from './CorrespondanceReplyButton';

interface CorrespondanceListViewProps {
  correspondances: CorrespondanceData[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'REPLIED': return 'bg-green-100 text-green-800';
    case 'INFORMATIF': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'bg-red-100 text-red-800';
    case 'HIGH': return 'bg-orange-100 text-orange-800';
    case 'MEDIUM': return 'bg-blue-100 text-blue-800';
    case 'LOW': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return 'En attente';
    case 'REPLIED': return 'Répondu';
    case 'INFORMATIF': return 'Informatif';
    default: return status;
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'Urgent';
    case 'HIGH': return 'Élevé';
    case 'MEDIUM': return 'Moyen';
    case 'LOW': return 'Faible';
    default: return priority;
  }
};

export const CorrespondanceListView = ({ correspondances, onView, onEdit }: CorrespondanceListViewProps) => {
  return (
    <div className="space-y-4">
      {correspondances.map((correspondance) => (
        <div key={correspondance.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {correspondance.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Objet:</strong> {correspondance.subject}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span><strong>De:</strong> {correspondance.from_address}</span>
                <span><strong>À:</strong> {correspondance.to_address}</span>
                <span><strong>Type:</strong> {correspondance.type === 'INCOMING' ? 'Entrante' : 'Sortante'}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <div className="flex space-x-2">
                <Badge className={getStatusColor(correspondance.status)}>
                  {getStatusText(correspondance.status)}
                </Badge>
                <Badge className={getPriorityColor(correspondance.priority)}>
                  {getPriorityText(correspondance.priority)}
                </Badge>
              </div>
              
              {/* Affichage des personnes concernées */}
              {correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0 && (
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="w-3 h-3 mr-1" />
                  {correspondance.personnesConcernees.length} personne(s) concernée(s)
                </div>
              )}
              
              {/* Indicateur de réponse */}
              {correspondance.parentCorrespondanceId && (
                <Badge variant="outline" className="text-xs">
                  Réponse
                </Badge>
              )}
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {correspondance.deposantInfo && (
              <div>
                <span className="font-medium text-gray-700">Déposant:</span>
                <span className="ml-2 text-gray-600">{correspondance.deposantInfo}</span>
              </div>
            )}
            {correspondance.importanceSubject && (
              <div>
                <span className="font-medium text-gray-700">Importance:</span>
                <span className="ml-2 text-gray-600">{correspondance.importanceSubject}</span>
              </div>
            )}
            {correspondance.responseReference && (
              <div>
                <span className="font-medium text-gray-700">Référence réponse:</span>
                <span className="ml-2 text-gray-600">{correspondance.responseReference}</span>
              </div>
            )}
            {correspondance.responseDate && (
              <div>
                <span className="font-medium text-gray-700">Date réponse:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(correspondance.responseDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {correspondance.tags && correspondance.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {correspondance.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-gray-500">
              Créé le {new Date(correspondance.created_at).toLocaleDateString('fr-FR')} par {correspondance.author?.firstName} {correspondance.author?.lastName}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(correspondance.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Voir
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(correspondance.id)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </Button>
              
              {/* Bouton de réponse - seulement si ce n'est pas déjà une réponse */}
              {!correspondance.parentCorrespondanceId && (
                <CorrespondanceReplyButton 
                  correspondance={{
                    _id: correspondance.id,
                    subject: correspondance.subject,
                    from_address: correspondance.from_address
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
