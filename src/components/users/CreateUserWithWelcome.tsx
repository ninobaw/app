import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Sparkles } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { UserCreatedSuccessDialog } from './UserCreatedSuccessDialog';
import { useToast } from '@/hooks/use-toast';

export const CreateUserWithWelcome: React.FC = () => {
  const { createUser, isCreating } = useUsers();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: 'USER' as const,
    airport: 'ENFIDHA' as const,
    directorate: '',
    managedDepartments: [] as string[],
    delegationLevel: 0
  });

  const [welcomeDialog, setWelcomeDialog] = useState<{
    isOpen: boolean;
    data: any;
    emailSent: boolean;
    emailError?: string | null;
  }>({
    isOpen: false,
    data: null,
    emailSent: false,
    emailError: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Champs requis manquants',
        description: 'Veuillez remplir au moins le prénom, nom et email.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Appeler la mutation de création d'utilisateur
      createUser(formData, {
        onSuccess: (response) => {
          console.log('🎉 Réponse complète de création:', response);
          
          // Ouvrir le dialog de bienvenue avec les données reçues
          setWelcomeDialog({
            isOpen: true,
            data: response.welcome,
            emailSent: response.emailSent,
            emailError: response.emailError
          });

          // Réinitialiser le formulaire
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            department: '',
            role: 'USER',
            airport: 'ENFIDHA',
            directorate: '',
            managedDepartments: [],
            delegationLevel: 0
          });
        },
        onError: (error) => {
          console.error('❌ Erreur lors de la création:', error);
        }
      });
    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
    }
  };

  const closeWelcomeDialog = () => {
    setWelcomeDialog({
      isOpen: false,
      data: null,
      emailSent: false,
      emailError: null
    });
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Créer un Nouvel Utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Nom de famille"
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
                placeholder="email@exemple.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Département"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="AGENT_BUREAU_ORDRE">Agent Bureau d'Ordre</SelectItem>
                    <SelectItem value="SUPERVISEUR_BUREAU_ORDRE">Superviseur Bureau d'Ordre</SelectItem>
                    <SelectItem value="APPROVER">Approbateur</SelectItem>
                    <SelectItem value="SOUS_DIRECTEUR">Sous-Directeur</SelectItem>
                    <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                    <SelectItem value="DIRECTEUR_GENERAL">Directeur Général</SelectItem>
                    <SelectItem value="ADMINISTRATOR">Administrateur</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="airport">Aéroport</Label>
                <Select 
                  value={formData.airport} 
                  onValueChange={(value: any) => setFormData({ ...formData, airport: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENFIDHA">✈️ Enfidha</SelectItem>
                    <SelectItem value="MONASTIR">🛫 Monastir</SelectItem>
                    <SelectItem value="GENERALE">🏢 Direction Générale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Champs spécifiques aux directeurs */}
            {(formData.role.includes('DIRECTEUR') || formData.role === 'SOUS_DIRECTEUR') && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">Informations Directeur</h4>
                
                <div>
                  <Label htmlFor="directorate">Direction</Label>
                  <Input
                    id="directorate"
                    value={formData.directorate}
                    onChange={(e) => setFormData({ ...formData, directorate: e.target.value })}
                    placeholder="Direction technique, commerciale, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="delegationLevel">Niveau de délégation</Label>
                  <Select 
                    value={formData.delegationLevel.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, delegationLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1 - Basique</SelectItem>
                      <SelectItem value="2">Niveau 2 - Intermédiaire</SelectItem>
                      <SelectItem value="3">Niveau 3 - Avancé</SelectItem>
                      <SelectItem value="4">Niveau 4 - Complet</SelectItem>
                      <SelectItem value="5">Niveau 5 - Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">Génération Automatique</h4>
                  <p className="text-sm text-green-700">
                    Un mot de passe temporaire sera généré automatiquement et envoyé par email à l'utilisateur.
                    Il devra le changer lors de sa première connexion.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isCreating ? 'Création en cours...' : 'Créer l\'Utilisateur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog de bienvenue */}
      {welcomeDialog.data && (
        <UserCreatedSuccessDialog
          isOpen={welcomeDialog.isOpen}
          onClose={closeWelcomeDialog}
          welcomeData={welcomeDialog.data}
          emailSent={welcomeDialog.emailSent}
          emailError={welcomeDialog.emailError}
        />
      )}
    </>
  );
};
