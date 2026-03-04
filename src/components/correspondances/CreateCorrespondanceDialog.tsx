import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Eye, X, Save, Mail, Clock, AlertTriangle, FileText, Users, RefreshCw } from 'lucide-react';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { Airport, UserRole } from '@/shared/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { useUsersForCorrespondance } from '@/hooks/useUsersForCorrespondance';
import { useTags } from '@/hooks/useTags';
import { useDeadlineTypes, useDefaultDeadlineType, calculateDeadlineFromType, formatDeadlineTypeDisplay, getDeadlineTypeColorClass } from '@/hooks/useDeadlineTypes';
import { TranslationPanel } from './TranslationPanel';

interface CreateCorrespondanceDialogProps {
  parentCorrespondance?: {
    _id: string;
    subject: string;
    from_address: string;
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateCorrespondanceDialog = ({ 
  parentCorrespondance, 
  isOpen, 
  onOpenChange 
}: CreateCorrespondanceDialogProps = {}) => {
  const [open, setOpen] = useState(isOpen ?? !!parentCorrespondance);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const { createCorrespondance, isCreating } = useCorrespondances();
  const { uploadFile, uploading: isUploadingFile } = useFileUpload();
  const { toast } = useToast();
  const { data: users = [] } = useUsersForCorrespondance();
  const { data: tags, isLoading: isLoadingTags } = useTags();
  const { data: deadlineTypes = [], isLoading: isLoadingDeadlineTypes } = useDeadlineTypes();
  const { data: defaultDeadlineType } = useDefaultDeadlineType();
  
  // Debug pour vérifier le chargement des types d'échéance
  console.log('🔍 [CreateCorrespondanceDialog] Debug types d\'échéance:');
  console.log('   - deadlineTypes:', deadlineTypes);
  console.log('   - deadlineTypes.length:', deadlineTypes.length);
  console.log('   - isLoadingDeadlineTypes:', isLoadingDeadlineTypes);
  console.log('   - defaultDeadlineType:', defaultDeadlineType);
  
  // Debug pour vérifier les utilisateurs
  console.log('CreateCorrespondanceDialog - users count:', users?.length || 0);
  console.log('CreateCorrespondanceDialog - users:', users);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    message: string;
    isValidating: boolean;
  }>({
    isValid: true, // Toujours valide pour saisie libre
    message: 'Saisie libre activée',
    isValidating: false
  });

  // Fonction pour valider le code en temps réel - SAISIE LIBRE TOTALE
  const validateCode = async (code: string) => {
    // Saisie libre complète - pas de validation en temps réel
    if (!code.trim()) {
      setCodeValidation({
        isValid: true,
        message: 'Saisie libre - Aucun format imposé',
        isValidating: false
      });
      return;
    }

    // Toujours valide pour la saisie libre
    setCodeValidation({
      isValid: true,
      message: 'Code accepté - Saisie libre activée',
      isValidating: false
    });
  };

  // Fonction pour obtenir le format attendu du code - SAISIE LIBRE
  const getCodeFormat = () => {
    return 'Saisie libre - Aucun format imposé';
  };

  // Formulaire simplifié pour le workflow bureau d'ordre
  const [formData, setFormData] = useState({
    title: parentCorrespondance ? `Réponse: ${parentCorrespondance.subject}` : '',
    type: parentCorrespondance ? 'OUTGOING' as const : 'INCOMING' as const,
    from_address: parentCorrespondance ? '' : '',
    to_address: parentCorrespondance ? parentCorrespondance.from_address : '',
    subject: parentCorrespondance ? `RE: ${parentCorrespondance.subject}` : '',
    content: '',
    deadlineTypeId: '',
    airport: 'ENFIDHA' as Airport,
    code: '', // Code de correspondance (A/D/MA/MD format)
    
    // Workflow bureau d'ordre - champs simplifiés
    personnesConcernees: [] as string[], // Personnes à notifier (obligatoire)
    deposantInfo: '', // Qui a déposé (pour correspondances entrantes)
    tags: [] as string[], // Tags pour catégoriser
    responseRequired: true, // Nouvelle propriété : nécessite une réponse ou informatif
    // Champs automatiques
    status: 'PENDING' as 'PENDING' | 'INFORMATIF',
    parentCorrespondanceId: parentCorrespondance?._id || undefined,
  });

  // Initialiser le type d'échéance par défaut
  React.useEffect(() => {
    if (defaultDeadlineType && !formData.deadlineTypeId) {
      setFormData(prev => ({ ...prev, deadlineTypeId: defaultDeadlineType.id }));
    }
  }, [defaultDeadlineType, formData.deadlineTypeId]);

  // Calcul automatique des échéances selon le type d'échéance sélectionné
  const calculateDeadline = (deadlineTypeId: string): Date => {
    const selectedType = deadlineTypes.find(type => type.id === deadlineTypeId);
    if (selectedType) {
      return calculateDeadlineFromType(selectedType);
    }
    // Fallback: 3 jours par défaut
    const now = new Date();
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation simplifiée
    if (!formData.title || !formData.subject || !formData.from_address.trim() || !formData.to_address.trim()) {
      toast({
        title: 'Champs obligatoires manquants',
        description: 'Veuillez remplir le titre, objet, expéditeur et destinataire.',
        variant: 'destructive',
      });
      return;
    }

    // Validation du code obligatoire
    if (!formData.code.trim()) {
      toast({
        title: 'Code obligatoire',
        description: 'Veuillez saisir un code de correspondance.',
        variant: 'destructive',
      });
      return;
    }

    // Validation du code supprimée - saisie libre activée
    // Le backend vérifiera uniquement l'unicité du code

    // Pour les correspondances entrantes qui nécessitent une réponse, au moins une personne concernée est obligatoire
    if (formData.type === 'INCOMING' && formData.responseRequired && formData.personnesConcernees.length === 0) {
      toast({
        title: 'Personne concernée requise',
        description: 'Veuillez sélectionner au moins une personne pour traiter cette correspondance.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile && !formData.content.trim()) {
      toast({
        title: 'Contenu manquant',
        description: 'Veuillez saisir le contenu ou joindre un fichier.',
        variant: 'destructive',
      });
      return;
    }

    let finalFilePath: string | undefined;
    let finalFileType: string | undefined;

    if (selectedFile) {
      try {
        const uploaded = await uploadFile(selectedFile, {
          documentType: 'correspondances',
          scopeCode: formData.airport,
          correspondenceType: formData.type,
          allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
          maxSize: 10
        });
        if (uploaded) {
          finalFilePath = uploaded.path;
          finalFileType = selectedFile.type;
        } else {
          // L'upload a échoué, mais on peut continuer sans fichier si du contenu est fourni
          if (!formData.content.trim()) {
            toast({
              title: 'Erreur d\'upload',
              description: 'L\'upload du fichier a échoué et aucun contenu textuel n\'est fourni.',
              variant: 'destructive',
            });
            return;
          }
          // Continuer sans fichier
          console.warn('Upload échoué, création de la correspondance sans fichier');
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        if (!formData.content.trim()) {
          toast({
            title: 'Erreur d\'upload',
            description: 'L\'upload du fichier a échoué et aucun contenu textuel n\'est fourni.',
            variant: 'destructive',
          });
          return;
        }
        // Continuer sans fichier
        console.warn('Upload échoué, création de la correspondance sans fichier');
      }
    }

    const { responseRequired, ...dataToSend } = formData;
    
    createCorrespondance({
      ...dataToSend,
      from_address: formData.from_address.trim(),
      to_address: formData.to_address.trim(),
      code: formData.code.trim(), // Inclure le code (sera généré automatiquement par le backend si vide)
      file_path: finalFilePath,
      file_type: finalFileType,
      responseDeadline: responseRequired ? calculateDeadline(formData.deadlineTypeId) : undefined,
      priority: responseRequired ? (deadlineTypes.find(type => type.id === formData.deadlineTypeId)?.priority || 'MEDIUM') : 'LOW',
      status: responseRequired ? 'PENDING' : 'INFORMATIF',
    }, {
      onSuccess: () => {
        toast({
          title: 'Correspondance créée',
          description: 'La correspondance a été enregistrée avec succès.',
          variant: 'default',
        });
        setFormData({
          title: '', type: 'INCOMING', from_address: '', to_address: '',
          subject: '', content: '', deadlineTypeId: defaultDeadlineType?.id || '', airport: 'ENFIDHA',
          code: '', personnesConcernees: [], deposantInfo: '', parentCorrespondanceId: undefined,
          tags: [], status: 'PENDING' as 'PENDING' | 'INFORMATIF', responseRequired: true,
        });
        removeFile();
        handleOpenChange(false);
      },
      onError: (error: any) => {
        console.error('Erreur création correspondance:', error);
        toast({
          title: 'Erreur de création',
          description: error.message || 'Erreur lors de la création de la correspondance.',
          variant: 'destructive',
        });
      }
    });
  };

  const getDeadlineInfo = (deadlineTypeId: string) => {
    const selectedType = deadlineTypes.find(type => type.id === deadlineTypeId);
    if (selectedType) {
      return { 
        days: selectedType.days, 
        color: getDeadlineTypeColorClass(selectedType).includes('red') ? 'text-red-600' :
               getDeadlineTypeColorClass(selectedType).includes('orange') ? 'text-orange-600' :
               getDeadlineTypeColorClass(selectedType).includes('green') ? 'text-green-600' :
               getDeadlineTypeColorClass(selectedType).includes('purple') ? 'text-purple-600' :
               'text-blue-600',
        icon: selectedType.priority === 'URGENT' ? AlertTriangle : Clock,
        label: selectedType.label
      };
    }
    return { days: 3, color: 'text-blue-600', icon: Clock, label: 'Standard' };
  };

  const deadlineInfo = getDeadlineInfo(formData.deadlineTypeId);
  const DeadlineIcon = deadlineInfo.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!parentCorrespondance && !isOpen && (
        <DialogTrigger asChild>
          <Button className="bg-aviation-sky hover:bg-aviation-sky-dark">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Correspondance
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {parentCorrespondance 
              ? `Répondre à: ${parentCorrespondance.subject}` 
              : 'Enregistrer une correspondance'
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informations essentielles */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informations essentielles
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de la correspondance"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'INCOMING' | 'OUTGOING') => setFormData({ ...formData, type: value })}
                  disabled={!!parentCorrespondance}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOMING">📥 Correspondance reçue</SelectItem>
                    <SelectItem value="OUTGOING">📤 Correspondance envoyée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nature de la correspondance - seulement pour les correspondances reçues */}
            {formData.type === 'INCOMING' && (
              <div>
                <Label htmlFor="responseRequired">Nature de la correspondance *</Label>
                <Select 
                  value={formData.responseRequired ? 'true' : 'false'} 
                  onValueChange={(value: string) => setFormData({ 
                    ...formData, 
                    responseRequired: value === 'true',
                    // Ajuster automatiquement le statut selon la nature
                    status: value === 'true' ? 'PENDING' : 'INFORMATIF'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>📋 Nécessite une réponse</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>ℹ️ Informatif seulement</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.responseRequired 
                    ? "⚠️ Cette correspondance nécessite une réponse et sera assignée aux personnes concernées"
                    : "ℹ️ Cette correspondance est informative et ne nécessite pas de réponse"
                  }
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_address">Expéditeur *</Label>
                <Input
                  id="from_address"
                  value={formData.from_address}
                  onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
                  placeholder="Nom, service, email de l'expéditeur"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to_address">Destinataire *</Label>
                <Input
                  id="to_address"
                  value={formData.to_address}
                  onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
                  placeholder="Nom, service, email du destinataire"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Objet *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Objet de la correspondance"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">Code de correspondance *</Label>
              <div className="relative">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setFormData({ ...formData, code: newCode });
                    // Validation en temps réel avec debounce
                    setTimeout(() => validateCode(newCode), 500);
                  }}
                  placeholder="Saisissez le code librement (ex: CORR-2024-001, DOC-123, etc.)"
                  className={`font-mono text-sm pr-10 ${
                    formData.code && codeValidation.isValid 
                      ? 'border-green-500 focus:border-green-500' 
                      : formData.code && !codeValidation.isValid && codeValidation.message
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                  required
                />
                {/* Indicateur de validation */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {codeValidation.isValidating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  ) : formData.code && codeValidation.isValid ? (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : formData.code && !codeValidation.isValid && codeValidation.message ? (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✕</span>
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* Format attendu */}
              <p className="text-xs text-gray-500 mt-1">
                {getCodeFormat()}
              </p>
              
              {/* Messages de validation */}
              {codeValidation.message && (
                <p className={`text-xs mt-1 ${
                  codeValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {codeValidation.isValid ? '✓' : '✕'} {codeValidation.message}
                </p>
              )}
              
              {!formData.type || !formData.airport ? (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Sélectionnez le type et l'aéroport pour valider le format
                </p>
              ) : null}
            </div>
          </div>

          {/* Section 2: Priorité et échéance (seulement si réponse requise) */}
          {(formData.type === 'OUTGOING' || formData.responseRequired) && (
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Priorité et échéance
                {formData.type === 'INCOMING' && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    Réponse requise
                  </Badge>
                )}
              </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="deadlineType">Type d'échéance *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Rafraîchissement manuel des types d\'échéance');
                      window.location.reload();
                    }}
                    className="h-6 w-6 p-0"
                    title="Rafraîchir les types d'échéance"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <Select 
                  value={formData.deadlineTypeId} 
                  onValueChange={(value: string) => setFormData({ ...formData, deadlineTypeId: value })}
                  disabled={isLoadingDeadlineTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingDeadlineTypes 
                        ? "Chargement des types d'échéance..." 
                        : deadlineTypes.length === 0 
                          ? "Aucun type d'échéance configuré"
                          : "Sélectionner un type d'échéance"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDeadlineTypes ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          Chargement...
                        </div>
                      </SelectItem>
                    ) : deadlineTypes.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        <div className="text-gray-500 text-sm">
                          Aucun type d'échéance configuré
                        </div>
                      </SelectItem>
                    ) : (
                      deadlineTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                            {formatDeadlineTypeDisplay(type)}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="airport">Aéroport *</Label>
                <Select 
                  value={formData.airport} 
                  onValueChange={(value: Airport) => setFormData({ ...formData, airport: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENFIDHA">✈️ Enfidha</SelectItem>
                    <SelectItem value="MONASTIR">✈️ Monastir</SelectItem>
                    <SelectItem value="GENERALE">🏢 Général</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Affichage de l'échéance calculée */}
            {formData.deadlineTypeId && (
              <div className={`p-3 rounded-md border-l-4 ${deadlineInfo.color.replace('text-', 'border-')} bg-white`}>
                <div className="flex items-center gap-2">
                  <DeadlineIcon className={`w-4 h-4 ${deadlineInfo.color}`} />
                  <span className="font-medium">Échéance automatique:</span>
                  <span className={deadlineInfo.color}>
                    {deadlineInfo.label} - {deadlineInfo.days} jour{deadlineInfo.days > 1 ? 's' : ''} 
                    ({calculateDeadline(formData.deadlineTypeId).toLocaleDateString('fr-FR')})
                  </span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Section 3: Workflow bureau d'ordre (pour correspondances entrantes) */}
          {formData.type === 'INCOMING' && (
            <div className={`space-y-4 p-4 rounded-lg ${
              formData.responseRequired ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {formData.responseRequired ? 'Traitement et assignation' : 'Traitement informatif'}
                {formData.responseRequired && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    Réponse requise
                  </Badge>
                )}
                {!formData.responseRequired && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Informatif
                  </Badge>
                )}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposantInfo">Partie déposante</Label>
                  <Input
                    id="deposantInfo"
                    value={formData.deposantInfo}
                    onChange={(e) => setFormData({ ...formData, deposantInfo: e.target.value })}
                    placeholder="Qui a déposé cette correspondance"
                  />
                </div>
                <div>
                  <Label>
                    {formData.responseRequired ? 'Personnes concernées *' : 'Personnes à informer'}
                  </Label>
                  <p className="text-xs text-gray-600 mb-2">
                    {formData.responseRequired 
                      ? 'Sélectionnez les personnes qui traiteront cette correspondance'
                      : 'Sélectionnez les personnes à informer (optionnel)'
                    }
                  </p>
                </div>
              </div>

              <div>
                <Select 
                  value="" 
                  onValueChange={(userId) => {
                    if (userId && !formData.personnesConcernees.includes(userId)) {
                      setFormData({ 
                        ...formData, 
                        personnesConcernees: [...formData.personnesConcernees, userId] 
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter une personne à notifier" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(user => 
                      !formData.personnesConcernees.includes(user._id) && 
                      [UserRole.DIRECTEUR_GENERAL, UserRole.DIRECTEUR, UserRole.SOUS_DIRECTEUR].includes(user.role as UserRole)
                    ).map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.role === UserRole.DIRECTEUR_GENERAL ? 'DG' :
                             user.role === UserRole.DIRECTEUR ? 'DIR' :
                             user.role === UserRole.SOUS_DIRECTEUR ? 'S-DIR' :
                             user.role.replace('DIRECTEUR_', '').replace('DIRECTEUR', 'DG')}
                          </Badge>
                          {user.firstName} {user.lastName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.personnesConcernees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.personnesConcernees.map((userId) => {
                      const user = users?.find(u => u._id === userId);
                      return user ? (
                        <div key={userId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-white">
                            {user.role.replace('DIRECTEUR_', '').replace('DIRECTEUR', 'DG')}
                          </Badge>
                          {user.firstName} {user.lastName}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              personnesConcernees: formData.personnesConcernees.filter(id => id !== userId)
                            })}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.personnesConcernees.length === 0 && formData.responseRequired && (
                  <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-800">
                    ⚠️ Au moins une personne doit être assignée pour traiter cette correspondance
                  </div>
                )}
                
                {formData.personnesConcernees.length === 0 && !formData.responseRequired && (
                  <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-sm text-blue-800">
                    ℹ️ Aucune personne assignée - Cette correspondance sera archivée comme informative
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Contenu */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contenu de la correspondance
            </h3>
            
            <div>
              <Label htmlFor="content">
                Contenu textuel {selectedFile ? '(optionnel si fichier joint)' : '*'}
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu ou résumé de la correspondance..."
                rows={4}
                required={!selectedFile}
              />
            </div>

            {/* Upload de fichier simplifié */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Document scanné ou fichier de la correspondance
              </p>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Sélectionner un fichier
              </Button>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  {previewUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Tags */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Badge className="w-4 h-4" />
              Tags et catégories
            </h3>
            
            <div>
              <Label>Tags (optionnel)</Label>
              <p className="text-xs text-gray-600 mb-2">
                Ajoutez des tags pour catégoriser cette correspondance
              </p>
              
              <Select 
                value="" 
                onValueChange={(tagName) => {
                  if (tagName && !formData.tags.includes(tagName)) {
                    setFormData({ 
                      ...formData, 
                      tags: [...formData.tags, tagName] 
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTags ? "Chargement des tags..." : "Ajouter un tag"} />
                </SelectTrigger>
                <SelectContent>
                  {tags?.filter(tag => !formData.tags.includes(tag.name)).map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Affichage des tags sélectionnés */}
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tagName) => {
                    const tag = tags?.find(t => t.name === tagName);
                    return (
                      <Badge 
                        key={tagName}
                        style={{ 
                          backgroundColor: tag?.color + '20' || '#3B82F620',
                          color: tag?.color || '#3B82F6',
                          borderColor: tag?.color + '40' || '#3B82F640'
                        }}
                        className="border flex items-center gap-1"
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag?.color || '#3B82F6' }}
                        />
                        {tagName}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags.filter(t => t !== tagName)
                          })}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {isLoadingTags && (
                <p className="text-sm text-gray-500 mt-1">Chargement des tags disponibles...</p>
              )}
              
              {!isLoadingTags && (!tags || tags.length === 0) && (
                <p className="text-sm text-gray-500 mt-1">
                  Aucun tag disponible. Créez des tags dans Paramètres &gt; Tags.
                </p>
              )}
            </div>
          </div>

          {/* Section 6: Traduction Microsoft Copilot */}
          <TranslationPanel
            sourceText={formData.content}
            onTranslatedTextChange={(translatedText) => {
              setFormData({ ...formData, content: translatedText });
            }}
            className="mt-6"
          />

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              disabled={isCreating || isUploadingFile}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUploadingFile}
              className="bg-aviation-sky hover:bg-aviation-sky-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUploadingFile ? 'Upload en cours...' : isCreating ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};