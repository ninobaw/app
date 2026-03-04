import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers'; // Import useUsers hook
import { UserMultiSelect } from '@/components/shared/UserMultiSelect'; // Import UserMultiSelect

export interface ActionDecidee {
  titre: string;
  description: string;
  responsable: string[]; // Changed to array of user IDs
  echeance: string;
  priorite: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  statut: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  collaborateurs?: string[]; // Stores user IDs
  // Nouveaux champs pour l'amélioration du processus
  datePartage?: string; // Date de partage du plan d'action
  personnesConcernees?: string[]; // Directeurs/sous-directeurs à notifier
}

interface ActionsDecideesFieldProps {
  actions: ActionDecidee[];
  onChange: (actions: ActionDecidee[]) => void;
  disabled?: boolean;
}

export const ActionsDecideesField: React.FC<ActionsDecideesFieldProps> = ({
  actions,
  onChange,
  disabled = false
}) => {
  const { users } = useUsers();
  
  const [newAction, setNewAction] = useState<ActionDecidee>({
    titre: '',
    description: '',
    responsable: [], // Initialize as empty array
    echeance: '',
    priorite: 'MEDIUM',
    statut: 'PENDING', // Fixed typo here
    collaborateurs: [],
    datePartage: '',
    personnesConcernees: []
  });

  const addAction = () => {
    if (!newAction.titre.trim() || newAction.responsable.length === 0) return; // Ensure at least one responsible is selected
    
    onChange([...actions, { ...newAction }]);
    setNewAction({
      titre: '',
      description: '',
      responsable: [],
      echeance: '',
      priorite: 'MEDIUM',
      statut: 'PENDING', // Fixed typo here
      collaborateurs: [],
      datePartage: '',
      personnesConcernees: []
    });
  };

  const removeAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index);
    onChange(updatedActions);
  };

  // Helper to get user full name from ID
  const getUserFullName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Actions décidées
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addAction}
            disabled={disabled || !newAction.titre.trim() || newAction.responsable.length === 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter une action
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire pour nouvelle action */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-action-titre">Action à réaliser</Label>
              <Input
                id="new-action-titre"
                value={newAction.titre}
                onChange={(e) => setNewAction({ ...newAction, titre: e.target.value })}
                placeholder="Titre de l'action"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-action-priorite">Priorité</Label>
              <Select 
                value={newAction.priorite} 
                onValueChange={(value: any) => setNewAction({ ...newAction, priorite: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Basse</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-action-description">Description détaillée</Label>
            <Textarea
              id="new-action-description"
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
              placeholder="Description de l'action à réaliser..."
              rows={3}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-action-responsable">Responsable(s) principal(aux)</Label>
              <UserMultiSelect
                selectedUserIds={newAction.responsable}
                onUserIdsChange={(ids) => setNewAction({ ...newAction, responsable: ids })}
                disabled={disabled}
                placeholder="Sélectionner un ou plusieurs utilisateurs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-action-echeance">Échéance</Label>
              <Input
                id="new-action-echeance"
                type="date"
                value={newAction.echeance}
                onChange={(e) => setNewAction({ ...newAction, echeance: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-action-statut">Statut initial</Label>
              <Select 
                value={newAction.statut} 
                onValueChange={(value: any) => setNewAction({ ...newAction, statut: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">À faire</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Nouveaux champs pour personnes concernées */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-action-personnes">Directeurs/Responsables à notifier</Label>
                <UserMultiSelect
                  selectedUserIds={newAction.personnesConcernees || []}
                  onUserIdsChange={(ids) => setNewAction({ ...newAction, personnesConcernees: ids })}
                  disabled={disabled}
                  placeholder="Sélectionner les personnes à notifier"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-action-partage">Date de partage du plan</Label>
                <Input
                  id="new-action-partage"
                  type="date"
                  value={newAction.datePartage || ''}
                  onChange={(e) => setNewAction({ ...newAction, datePartage: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des actions existantes */}
        {actions.map((action, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{action.titre}</h4>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Responsable(s): {action.responsable.map(getUserFullName).join(', ')}</span>
                    <span>Échéance: {action.echeance}</span>
                  </div>
                  {action.personnesConcernees && action.personnesConcernees.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Personnes notifiées:</span> {action.personnesConcernees.map(getUserFullName).join(', ')}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    action.priorite === 'URGENT' ? 'bg-red-100 text-red-800' :
                    action.priorite === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    action.priorite === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {action.priorite}
                  </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      action.statut === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      action.statut === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {action.statut}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeAction(index)}
                disabled={disabled}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune action décidée pour le moment.</p>
            <p className="text-sm">Utilisez le formulaire ci-dessus pour ajouter des actions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};