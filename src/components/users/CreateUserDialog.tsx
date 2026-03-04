import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserPlus } from 'lucide-react'; // Added UserPlus
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Airport } from '@/shared/types'; // Import Airport type

type UserRole = 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'AGENT' | 'AGENT_BUREAU_ORDRE' | 'SUPERVISEUR_BUREAU_ORDRE' | 'DIRECTEUR_GENERAL' | 'DIRECTEUR' | 'SOUS_DIRECTEUR' | 'APPROVER' | 'USER' | 'VISITOR'; // Updated type

export const CreateUserDialog = () => {
  const [open, setOpen] = useState(false);
  const { createUser, isCreating } = useUsers();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '', // Changed from first_name
    lastName: '',  // Changed from last_name
    role: 'AGENT' as UserRole,
    airport: 'ENFIDHA' as Airport, // Updated to use Airport type
    phone: '',
    department: '',
    password: '',
    // Nouveaux champs pour les directeurs
    directorate: '',
    managedDepartments: [] as string[],
    delegationLevel: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive"
      });
      return;
    }

    // Validation du mot de passe
    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive"
      });
      return;
    }

    // Préparer les données à envoyer
    const dataToSend: any = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      airport: formData.airport,
      phone: formData.phone,
      department: formData.department,
      password: formData.password,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    // Ajouter les champs spécifiques aux directeurs SEULEMENT s'ils sont requis et remplis
    const isDirector = ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'].includes(formData.role);
    
    // Validation obligatoire pour les directeurs
    if (isDirector) {
      if (!formData.directorate || formData.directorate.trim() === '') {
        toast({
          title: 'Champ obligatoire manquant',
          description: 'La direction est obligatoire pour les rôles de directeur.',
          variant: 'destructive',
        });
        return;
      }
      dataToSend.directorate = formData.directorate;
      
      if (formData.managedDepartments && formData.managedDepartments.length > 0) {
        dataToSend.managedDepartments = formData.managedDepartments;
      }
      if (formData.delegationLevel && formData.delegationLevel > 0) {
        dataToSend.delegationLevel = formData.delegationLevel;
      }
    }

    createUser(dataToSend, {
      onSuccess: () => {
        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'AGENT',
          airport: 'ENFIDHA',
          phone: '',
          department: '',
          password: '',
          directorate: '',
          managedDepartments: [],
          delegationLevel: 1
        });
        setOpen(false);
      }
    });
  };

  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return "Accès complet à toutes les fonctionnalités";
      case 'ADMINISTRATOR':
        return "Gestion des utilisateurs, documents, rapports et paramètres";
      case 'APPROVER':
        return "Approbation des documents, création et consultation";
      case 'USER':
        return "Consultation et création de documents, gestion du profil";
      case 'VISITOR':
        return "Consultation des documents uniquement";
      case 'AGENT':
        return "Agent général du système";
      case 'AGENT_BUREAU_ORDRE':
        return "Création et gestion des correspondances par aéroport";
      case 'SUPERVISEUR_BUREAU_ORDRE':
        return "Supervision des correspondances, échéances et rapports";
      case 'DIRECTEUR_GENERAL':
        return "Direction générale, validation des réponses";
      case 'DIRECTEUR':
        return "Direction départementale";
      case 'SOUS_DIRECTEUR':
        return "Sous-direction départementale";
      default:
        return "Consultation et création de documents, gestion du profil";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-aviation-sky hover:bg-aviation-sky-dark">
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Nom"
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
              placeholder="exemple@sgdo.tn"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 caractères"
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
                placeholder="+216 XX XXX XXX"
              />
            </div>
            <div>
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Ex: Opérations"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le rôle" />
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
                  <SelectValue placeholder="Sélectionner l'aéroport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                  <SelectItem value="MONASTIR">Monastir</SelectItem>
                  <SelectItem value="GENERALE">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'].includes(formData.role) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="directorate">Direction *</Label>
                <Select 
                  value={formData.directorate} 
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
              <div>
                <Label htmlFor="managedDepartments">Départements gérés</Label>
                <Input
                  id="managedDepartments"
                  value={formData.managedDepartments.join(', ')}
                  onChange={(e) => setFormData({ ...formData, managedDepartments: e.target.value.split(', ') })}
                  placeholder="Ex: Opérations, Ressources Humaines"
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Permissions du rôle sélectionné:</h4>
            <div className="text-sm text-blue-800">
              {getRoleDescription(formData.role)}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};