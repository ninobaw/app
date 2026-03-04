import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';

interface ProfilePhotoUploadProps {
  profilePhotoUrl?: string | null; // URL absolue de la photo actuelle
  firstName?: string;
  lastName?: string;
  onPhotoStaged: (file: File | null) => void; // Callback pour notifier le parent du fichier sélectionné (File) ou de la suppression (null)
  isSaving: boolean; // Indique si le parent est en cours de sauvegarde
}

export const ProfilePhotoUpload = ({
  profilePhotoUrl,
  firstName,
  lastName,
  onPhotoStaged,
  isSaving,
}: ProfilePhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Mettre à jour l'aperçu lorsque la photo de profil change (par exemple, après une sauvegarde réussie)
  useEffect(() => {
    if (selectedFile) {
      // Si un fichier est sélectionné, l'aperçu est basé sur ce fichier
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url); // Nettoyage de l'URL de l'objet
    } else if (profilePhotoUrl) {
      // Sinon, si une URL de photo existe, utiliser celle-ci
      setPreviewUrl(profilePhotoUrl);
    } else {
      // Si aucune photo, pas d'aperçu
      setPreviewUrl(null);
    }
  }, [selectedFile, profilePhotoUrl]);

  // Reset selectedFile when profilePhotoUrl changes (after successful save)
  useEffect(() => {
    if (profilePhotoUrl && selectedFile) {
      setSelectedFile(null);
    }
  }, [profilePhotoUrl, selectedFile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation simple du type de fichier et de la taille
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSizeMB = 5; // 5MB

      if (!allowedTypes.includes(file.type)) {
        alert(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
        event.target.value = ''; // Réinitialiser l'input file
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`);
        event.target.value = ''; // Réinitialiser l'input file
        return;
      }

      setSelectedFile(file);
      onPhotoStaged(file); // Notifier le parent du fichier sélectionné
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null); // Effacer le fichier sélectionné localement
    onPhotoStaged(null); // Notifier le parent de la suppression
  };

  // Déterminer l'URL de l'avatar à afficher
  const currentAvatarSrc = selectedFile ? previewUrl : profilePhotoUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={currentAvatarSrc || undefined} alt="Photo de profil" />
          <AvatarFallback className="bg-aviation-sky text-white text-xl">
            {firstName?.[0]}{lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute -bottom-2 -right-2 flex space-x-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isSaving}
            className="hidden"
            id="photo-upload"
          />
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-8 h-8 p-0"
            disabled={isSaving}
            asChild
          >
            <label htmlFor="photo-upload" className="cursor-pointer">
              {isSaving ? (
                <Upload className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
          </Button>
          
          {(profilePhotoUrl || selectedFile) && ( // Afficher le bouton de suppression si une photo est présente ou en attente
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-8 h-8 p-0 text-red-600 hover:text-red-700"
              disabled={isSaving}
              onClick={handleRemovePhoto}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Cliquez sur l'icône pour changer votre photo de profil
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Formats acceptés: JPG, PNG, GIF (max 5MB)
        </p>
      </div>
    </div>
  );
};