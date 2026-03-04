import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, Calendar, Save, Lock } from 'lucide-react'; // Import Lock icon
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils'; // Import getAbsoluteFilePath
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useFileUpload } from '@/hooks/useFileUpload'; // Import useFileUpload
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog'; // Import ChangePasswordDialog

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const { uploadFile, deleteFile, uploading: uploadingFile } = useFileUpload(); // Get file upload hooks
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
  });
  const [stagedProfilePhoto, setStagedProfilePhoto] = useState<File | null | undefined>(undefined); // undefined: no change, null: remove, File: new file
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false); // State for change password dialog

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
      });
      // Réinitialiser stagedProfilePhoto quand le profil est chargé/mis à jour
      setStagedProfilePhoto(undefined); 
    }
  }, [profile]);

  // Force re-render when user data changes (after profile update)
  useEffect(() => {
    if (user?.profilePhoto !== profile?.profilePhoto) {
      // Force component re-render when AuthContext user data changes
      setStagedProfilePhoto(undefined);
    }
  }, [user?.profilePhoto, profile?.profilePhoto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔧 [Profile] Début de la soumission du formulaire');
    console.log('🔧 [Profile] stagedProfilePhoto:', stagedProfilePhoto);
    console.log('🔧 [Profile] formData:', formData);

    const finalProfileUpdates: { [key: string]: any } = { ...formData }; // Start with text fields

    // Gérer l'upload/suppression de la photo de profil si elle a été modifiée
    if (stagedProfilePhoto !== undefined) {
      if (stagedProfilePhoto instanceof File) { // Nouvelle photo sélectionnée
        console.log('🔧 [Profile] Upload d\'une nouvelle photo:', stagedProfilePhoto.name);
        
        const uploaded = await uploadFile(stagedProfilePhoto, {
          documentType: 'profiles', // Dossier de destination
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
          maxSize: 5 // 5MB
        });
        
        console.log('🔧 [Profile] Résultat upload:', uploaded);
        
        if (uploaded) {
          finalProfileUpdates.profilePhoto = uploaded.path; // Stocker le chemin relatif
          console.log('🔧 [Profile] Chemin de la photo stocké:', uploaded.path);
          
          // Si une ancienne photo existait, la supprimer après l'upload réussi de la nouvelle
          if (profile?.profilePhoto) {
            console.log('🔧 [Profile] Suppression de l\'ancienne photo:', profile.profilePhoto);
            await deleteFile(profile.profilePhoto);
          }
        } else {
          console.error('❌ [Profile] L\'upload a échoué, annulation de la soumission');
          // L'upload a échoué, annuler la soumission du formulaire
          return;
        }
      } else if (stagedProfilePhoto === null) { // Photo explicitement supprimée
        console.log('🔧 [Profile] Suppression de la photo de profil');
        finalProfileUpdates.profilePhoto = null; // Définir la photo sur null
        if (profile?.profilePhoto) {
          console.log('🔧 [Profile] Suppression de l\'ancienne photo physique:', profile.profilePhoto);
          await deleteFile(profile.profilePhoto); // Supprimer l'ancienne photo physique
        }
      }
    }

    console.log('🔧 [Profile] finalProfileUpdates à envoyer:', finalProfileUpdates);
    console.log('🔧 [Profile] Appel de updateProfile...');

    // Appeler la mutation de mise à jour du profil avec toutes les modifications
    updateProfile(finalProfileUpdates);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Réinitialiser les champs du formulaire aux valeurs du profil actuel
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
      });
    }
    // Annuler toute modification de photo en attente
    setStagedProfilePhoto(undefined);
    // Naviguer vers la page d'accueil
    navigate('/');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Déterminer l'URL de la photo à afficher dans le composant ProfilePhotoUpload
  // Prioriser les données de l'AuthContext (user) qui sont mises à jour après sauvegarde
  const currentProfilePhoto = user?.profilePhoto || profile?.profilePhoto;
  
  // Ajouter un timestamp pour éviter le cache du navigateur
  const photoToDisplayUrl = stagedProfilePhoto instanceof File 
    ? URL.createObjectURL(stagedProfilePhoto) 
    : (stagedProfilePhoto === null ? null : (currentProfilePhoto ? `${getAbsoluteFilePath(currentProfilePhoto)}?t=${Date.now()}` : null));


  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-500 mt-1">
            Gérer vos informations personnelles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte de profil */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <ProfilePhotoUpload
                  profilePhotoUrl={photoToDisplayUrl}
                  firstName={profile?.firstName}
                  lastName={profile?.lastName}
                  onPhotoStaged={setStagedProfilePhoto}
                  isSaving={isUpdating || uploadingFile}
                />
                <div className="text-center">
                  <h3 className="text-xl font-semibold">
                    {profile?.firstName} {profile?.lastName}
                  </h3>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.role}
                  </Badge>
                </div>
                <div className="w-full space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>{profile?.airport}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Inscrit le {formatDate(profile?.createdAt || '')}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={() => setIsChangePasswordDialogOpen(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire d'édition */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      L'email ne peut pas être modifié
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Ex: Sécurité, Maintenance, Opérations..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Aéroport</Label>
                    <Input
                      value={profile?.airport || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      L'aéroport d'affectation ne peut pas être modifié
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating || uploadingFile}
                    className="bg-aviation-sky hover:bg-aviation-sky-dark"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating || uploadingFile ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={isChangePasswordDialogOpen} 
        onOpenChange={setIsChangePasswordDialogOpen} 
      />
    </AppLayout>
  );
};

export default Profile;