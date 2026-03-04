import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { getAbsoluteFilePath } from '@/shared/utils'; // Import getAbsoluteFilePath

interface ViewUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewUserDialog: React.FC<ViewUserDialogProps> = ({ user, open, onOpenChange }) => {
  const getRoleInfo = (role: string) => {
    const roleConfig = {
      'SUPER_ADMIN': { label: 'Super Admin', color: 'bg-red-100 text-red-800', description: 'Accès complet à toutes les fonctionnalités' },
      'ADMINISTRATOR': { label: 'Administrateur', color: 'bg-blue-100 text-blue-800', description: 'Gestion des utilisateurs, documents, rapports et paramètres' },
      'APPROVER': { label: 'Approbateur', color: 'bg-green-100 text-green-800', description: 'Approbation des documents, création et consultation' },
      'USER': { label: 'Utilisateur', color: 'bg-gray-100 text-gray-800', description: 'Consultation et création de documents, gestion du profil' },
      'VISITOR': { label: 'Visiteur', color: 'bg-yellow-100 text-yellow-800', description: 'Consultation des documents uniquement' },
      'AGENT_BUREAU_ORDRE': { label: 'Agent Bureau d\'Ordre', color: 'bg-purple-100 text-purple-800', description: 'Création et consultation des correspondances et documents' },
      'DIRECTEUR_GENERAL': { label: 'Directeur Général', color: 'bg-indigo-100 text-indigo-800', description: 'Direction générale - Accès complet à tous les départements' },
      'DIRECTEUR_TECHNIQUE': { label: 'Directeur Technique', color: 'bg-cyan-100 text-cyan-800', description: 'Direction technique - Gestion maintenance, IT et sécurité' },
      'DIRECTEUR_COMMERCIAL': { label: 'Directeur Commercial', color: 'bg-emerald-100 text-emerald-800', description: 'Direction commerciale - Gestion marketing, ventes et développement' },
      'DIRECTEUR_FINANCIER': { label: 'Directeur Financier', color: 'bg-amber-100 text-amber-800', description: 'Direction financière - Gestion comptabilité et budget' },
      'DIRECTEUR_OPERATIONS': { label: 'Directeur Opérations', color: 'bg-orange-100 text-orange-800', description: 'Direction opérations - Gestion opérations aéroportuaires' },
      'DIRECTEUR_RH': { label: 'Directeur RH', color: 'bg-pink-100 text-pink-800', description: 'Direction RH - Gestion recrutement et formation' },
      'SOUS_DIRECTEUR': { label: 'Sous-Directeur', color: 'bg-slate-100 text-slate-800', description: 'Sous-direction - Assistance à la direction' }
    };
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
  };

  const roleInfo = getRoleInfo(user.role);
  const avatarSrc = user.profilePhoto ? getAbsoluteFilePath(user.profilePhoto) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"> {/* Added max-h-[90vh] overflow-y-auto */}
        <DialogHeader>
          <DialogTitle>Profil Utilisateur</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Photo et informations principales */}
          <div className="flex items-start space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarSrc} /> {/* Use the constructed absolute URL */}
              <AvatarFallback className="bg-aviation-sky text-white text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  Aéroport {user.airport}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {user.isActive ? 'Actif' : 'Inactif'}
              </Badge>
              <Badge className={roleInfo.color}>
                {roleInfo.label}
              </Badge>
            </div>
          </div>

          {/* Informations professionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Professionnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Département</label>
                <p className="text-gray-900">{user.department || 'Non défini'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Poste</label>
                <p className="text-gray-900">{user.position || 'Non défini'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Aéroport</label>
                <p className="text-gray-900">{user.airport}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Rôle et Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                </div>
                <p className="text-sm text-gray-600">{roleInfo.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Historique de connexion */}
          {user.lastLogin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dernière Activité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Dernière connexion le {new Date(user.lastLogin).toLocaleDateString('fr-FR')} à {new Date(user.lastLogin).toLocaleTimeString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};