import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Airport } from '@/shared/types'; // Import Airport type

type UserRole = 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'AGENT' | 'AGENT_BUREAU_ORDRE' | 'SUPERVISEUR_BUREAU_ORDRE' | 'DIRECTEUR_GENERAL' | 'DIRECTEUR' | 'SOUS_DIRECTEUR' | 'APPROVER' | 'USER' | 'VISITOR'; // Updated type

interface EditUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, open, onOpenChange }) => {
  const { updateUser, isUpdating } = useUsers();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'AGENT' as UserRole,
    airport: 'ENFIDHA' as Airport,
    isActive: true,
    // Nouveaux champs pour les directeurs
    directorate: '',
    managedDepartments: [] as string[],
    delegationLevel: 1
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        role: user.role || 'AGENT',
        airport: user.airport || 'ENFIDHA',
        isActive: user.isActive ?? true,
        directorate: user.directorate || '',
        managedDepartments: user.managedDepartments || [],
        delegationLevel: user.delegationLevel || 1
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    updateUser({ id: user.id, ...formData }, {
      onSuccess: () => {
        onOpenChange(false);
        // Removed the duplicate toast call here.
        // The toast is now handled directly within the useUsers hook's mutation onSuccess.
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="position">Poste</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrateur</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="AGENT_BUREAU_ORDRE">Agent Bureau d'Ordre</SelectItem>
                  <SelectItem value="SUPERVISEUR_BUREAU_ORDRE">Superviseur Bureau d'Ordre</SelectItem>
                  <SelectItem value="DIRECTEUR_GENERAL">Directeur Général</SelectItem>
                  <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                  <SelectItem value="SOUS_DIRECTEUR">Sous-Directeur</SelectItem>
                  <SelectItem value="APPROVER">Approbateur</SelectItem>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="VISITOR">Visiteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="airport">Aéroport</Label>
              <Select value={formData.airport} onValueChange={(value: Airport) => setFormData({ ...formData, airport: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                  <SelectItem value="MONASTIR">Monastir</SelectItem>
                  <SelectItem value="GENERALE">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === 'DIRECTEUR_GENERAL' || formData.role === 'DIRECTEUR' || formData.role === 'SOUS_DIRECTEUR' ? (
            <div>
              <Label htmlFor="directorate">Direction</Label>
              <Select 
                value={formData.directorate || ''} 
                onValueChange={(value) => setFormData({ ...formData, directorate: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">Direction Générale</SelectItem>
                  <SelectItem value="TECHNIQUE">Direction Technique</SelectItem>
                  <SelectItem value="COMMERCIAL">Direction Commerciale</SelectItem>
                  <SelectItem value="FINANCIER">Direction Financière</SelectItem>
                  <SelectItem value="OPERATIONS">Direction des Opérations</SelectItem>
                  <SelectItem value="RH">Direction des Ressources Humaines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {formData.role === 'DIRECTEUR_GENERAL' || formData.role === 'DIRECTEUR' || formData.role === 'SOUS_DIRECTEUR' ? (
            <div>
              <Label htmlFor="managedDepartments">Départements gérés</Label>
              <Input
                id="managedDepartments"
                value={formData.managedDepartments.join(', ')}
                onChange={(e) => setFormData({ ...formData, managedDepartments: e.target.value.split(', ') })}
              />
            </div>
          ) : null}

          {formData.role === 'DIRECTEUR_GENERAL' || formData.role === 'DIRECTEUR' || formData.role === 'SOUS_DIRECTEUR' ? (
            <div>
              <Label htmlFor="delegationLevel">Niveau de délégation</Label>
              <Input
                id="delegationLevel"
                type="number"
                value={formData.delegationLevel}
                onChange={(e) => setFormData({ ...formData, delegationLevel: parseInt(e.target.value) })}
              />
            </div>
          ) : null}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Compte actif</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};