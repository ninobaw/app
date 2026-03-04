import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Plus,
  Save,
  ListTodo,
  MessageSquare,
  Paperclip,
  Info,
  X
} from 'lucide-react';
import { formatDate } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { useTags } from '@/hooks/useTags';
import { useDeadlineTypes, useDefaultDeadlineType, calculateDeadlineFromType, formatDeadlineTypeDisplay, getDeadlineTypeColorClass } from '@/hooks/useDeadlineTypes';
import { useUsersForCorrespondance } from '@/hooks/useUsersForCorrespondance';
import { Airport, UserRole } from '@/shared/types';
import type { CorrespondanceData } from '@/hooks/useCorrespondances';

interface Action {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface CorrespondanceEditDialogProps {
  correspondance: CorrespondanceData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedCorrespondance: CorrespondanceData) => void;
}

export const CorrespondanceEditDialog: React.FC<CorrespondanceEditDialogProps> = ({
  correspondance,
  isOpen,
  onClose,
  onSave,
}) => {
  const { toast } = useToast();
  const { updateCorrespondance } = useCorrespondances();
  const { data: tags, isLoading: isLoadingTags } = useTags();
  const { data: deadlineTypes = [] } = useDeadlineTypes();
  const { data: defaultDeadlineType } = useDefaultDeadlineType();
  const { data: users = [] } = useUsersForCorrespondance();
  const [isLoading, setIsLoading] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAction, setNewAction] = useState({
    description: '',
    assignedTo: '',
    dueDate: '',
    status: 'PENDING' as const
  });
  const [newComment, setNewComment] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  
  // État pour les champs éditables
  const [editableFields, setEditableFields] = useState({
    title: correspondance?.title || correspondance?.subject || '',
    type: (correspondance?.type as 'INCOMING' | 'OUTGOING') || 'INCOMING',
    from_address: correspondance?.from_address || '',
    to_address: correspondance?.to_address || '',
    subject: correspondance?.subject || '',
    content: correspondance?.content || '',
    priority: (correspondance?.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
    status: (correspondance?.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REPLIED' | 'INFORMATIF') || 'PENDING',
    airport: (correspondance?.airport as Airport) || 'ENFIDHA',
    code: correspondance?.code || '',
    tags: correspondance?.tags || [],
    deadline: correspondance?.deadline || '',
    // Champs de stockage interne (non envoyés à l'API)
    personnesConcernees: correspondance?.informationTransmittedTo?.split(', ').filter(Boolean) || [],
    deposantInfo: correspondance?.informationActions || '',
    deadlineTypeId: '', // Pour l'interface uniquement
    responseRequired: correspondance?.status !== 'INFORMATIF', // Déduit du statut
  });

  // Mettre à jour les champs éditables lorsque la correspondance change
  useEffect(() => {
    if (correspondance) {
      setEditableFields({
        title: correspondance.title || correspondance.subject || '',
        type: (correspondance.type as 'INCOMING' | 'OUTGOING') || 'INCOMING',
        from_address: correspondance.from_address || '',
        to_address: correspondance.to_address || '',
        subject: correspondance.subject || '',
        content: correspondance.content || '',
        priority: (correspondance.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
        status: (correspondance.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REPLIED' | 'INFORMATIF') || 'PENDING',
        airport: (correspondance.airport as Airport) || 'ENFIDHA',
        code: correspondance.code || '',
        tags: correspondance.tags || [],
        deadline: correspondance.deadline || '',
        // Champs de stockage interne (non envoyés à l'API)
        personnesConcernees: correspondance?.informationTransmittedTo?.split(', ').filter(Boolean) || [],
        deposantInfo: correspondance?.informationActions || '',
        deadlineTypeId: '', // Pour l'interface uniquement
        responseRequired: correspondance.status !== 'INFORMATIF', // Déduit du statut
      });
    }
  }, [correspondance]);
  
  // Gestion des actions et commentaires

  useEffect(() => {
    if (correspondance) {
      // Simuler le chargement des données existantes
      const loadCorrespondanceData = async () => {
        try {
          // Ici, vous devriez appeler votre API pour charger les données
          // Par exemple : const data = await fetchCorrespondanceDetails(correspondance.id);
          // setActions(data.actions || []);
          // setComments(data.comments || []);
          // setAttachments(data.attachments || []);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        }
      };

      loadCorrespondanceData();
    }
  }, [correspondance]);

  const handleAddAction = () => {
    if (!newAction.description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description pour l'action.",
        variant: "destructive",
      });
      return;
    }

    const action: Action = {
      id: Date.now().toString(),
      description: newAction.description,
      status: newAction.status,
      assignedTo: newAction.assignedTo,
      dueDate: newAction.dueDate,
      createdAt: new Date().toISOString()
    };

    setActions([...actions, action]);
    setNewAction({
      description: '',
      assignedTo: '',
      dueDate: '',
      status: 'PENDING'
    });

    toast({
      title: "Action ajoutée",
      description: "L'action a été ajoutée avec succès.",
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un commentaire.",
        variant: "destructive",
      });
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: 'Utilisateur actuel', // À remplacer par l'utilisateur connecté
      createdAt: new Date().toISOString()
    };

    setComments([...comments, comment]);
    setNewComment('');

    toast({
      title: "Commentaire ajouté",
      description: "Le commentaire a été ajouté avec succès.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    
    const files = event.target.files;
    const newFiles: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type
    }));

    setAttachments(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Fichiers uploadés",
      description: `${files.length} fichier(s) ont été ajoutés.`,
    });
  };

  const handleSave = async () => {
    console.log('🔧 [CorrespondanceEditDialog] Début de la sauvegarde');
    console.log('🔧 [CorrespondanceEditDialog] editableFields:', editableFields);
    
    try {
      setIsLoading(true);

      if (!correspondance) {
        console.error('❌ [CorrespondanceEditDialog] Aucune correspondance fournie');
        return;
      }

      const updatedData: Partial<CorrespondanceData> = {
        subject: editableFields.subject,
        from_address: editableFields.from_address,
        to_address: editableFields.to_address,
        content: editableFields.content,
        priority: editableFields.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        status: editableFields.status as 'PENDING' | 'REPLIED' | 'INFORMATIF',
        type: editableFields.type as 'INCOMING' | 'OUTGOING',
        airport: editableFields.airport as Airport,
        code: editableFields.code,
        tags: editableFields.tags,
        deadline: editableFields.deadline,
        // Champs additionnels qui existent dans le modèle
        informationTransmittedTo: editableFields.personnesConcernees.join(', '),
        updated_at: new Date().toISOString(),
      };

      console.log('🔧 [CorrespondanceEditDialog] updatedData à envoyer:', updatedData);
      console.log('🔧 [CorrespondanceEditDialog] ID correspondance:', correspondance._id || correspondance.id);

      // Appel API pour sauvegarder
      await updateCorrespondance({ id: correspondance._id || correspondance.id, ...updatedData });

      console.log('✅ [CorrespondanceEditDialog] Sauvegarde réussie');

      if (onSave) {
        onSave({ ...correspondance, ...updatedData });
      }

      toast({
        title: "Sauvegardé",
        description: "Les modifications ont été sauvegardées avec succès.",
      });

      console.log('✅ [CorrespondanceEditDialog] Toast de succès affiché');
      onClose();
    } catch (error) {
      console.error('❌ [CorrespondanceEditDialog] Erreur lors de la sauvegarde:', error);
      
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });

      console.log('❌ [CorrespondanceEditDialog] Toast d\'erreur affiché');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REPLIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'INFORMATIF': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!correspondance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Édition de la correspondance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Objet</Label>
                  <Input
                    value={editableFields.subject}
                    onChange={(e) => setEditableFields({...editableFields, subject: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priorité</Label>
                  <Select 
                    value={editableFields.priority} 
                    onValueChange={(value) => setEditableFields({...editableFields, priority: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="LOW">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">De</Label>
                  <Input
                    value={editableFields.from_address}
                    onChange={(e) => setEditableFields({...editableFields, from_address: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">À</Label>
                  <Input
                    value={editableFields.to_address}
                    onChange={(e) => setEditableFields({...editableFields, to_address: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Contenu</Label>
                <Textarea
                  value={editableFields.content}
                  onChange={(e) => setEditableFields({...editableFields, content: e.target.value})}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {/* Champs additionnels */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <Select 
                    value={editableFields.type} 
                    onValueChange={(value: 'INCOMING' | 'OUTGOING') => setEditableFields({...editableFields, type: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOMING">Entrant</SelectItem>
                      <SelectItem value="OUTGOING">Sortant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <Select 
                    value={editableFields.status} 
                    onValueChange={(value: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REPLIED' | 'INFORMATIF') => setEditableFields({...editableFields, status: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                      <SelectItem value="REPLIED">Répondu</SelectItem>
                      <SelectItem value="INFORMATIF">Informatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Code de correspondance</Label>
                  <Input
                    value={editableFields.code}
                    onChange={(e) => setEditableFields({...editableFields, code: e.target.value})}
                    className="mt-1"
                    placeholder="Code de la correspondance"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Aéroport</Label>
                  <Select 
                    value={editableFields.airport} 
                    onValueChange={(value: Airport) => setEditableFields({...editableFields, airport: value})}
                  >
                    <SelectTrigger className="mt-1">
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

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Tags</Label>
                <p className="text-xs text-gray-600 mb-2">
                  Ajoutez des tags pour catégoriser cette correspondance
                </p>
                
                <Select 
                  value="" 
                  onValueChange={(tagName: string) => {
                    if (tagName && !editableFields.tags.includes(tagName)) {
                      setEditableFields({ 
                        ...editableFields, 
                        tags: [...editableFields.tags, tagName] 
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter un tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags?.filter(tag => !editableFields.tags.includes(tag.name)).map((tag) => (
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
                {editableFields.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editableFields.tags.map((tagName) => {
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
                            onClick={() => setEditableFields({
                              ...editableFields,
                              tags: editableFields.tags.filter((t: string) => t !== tagName)
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
              </div>
            </CardContent>
          </Card>

          {/* Section Type d'échéance et personnes concernées */}
          {(editableFields.type === 'OUTGOING' || editableFields.status !== 'INFORMATIF') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Échéance et assignation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type d'échéance</Label>
                    <Select 
                      value={editableFields.deadlineTypeId} 
                      onValueChange={(value) => setEditableFields({...editableFields, deadlineTypeId: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner un type d'échéance" />
                      </SelectTrigger>
                      <SelectContent>
                        {deadlineTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              />
                              {formatDeadlineTypeDisplay(type)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Personnes concernées</Label>
                    <Select 
                      value="" 
                      onValueChange={(userId: string) => {
                        if (userId && !editableFields.personnesConcernees.includes(userId)) {
                          setEditableFields({ 
                            ...editableFields, 
                            personnesConcernees: [...editableFields.personnesConcernees, userId] 
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Ajouter une personne" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(user => 
                          !editableFields.personnesConcernees.includes(user._id) && 
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
                    
                    {editableFields.personnesConcernees.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editableFields.personnesConcernees.map((userId: string) => {
                          const user = users?.find(u => u._id === userId);
                          return user ? (
                            <div key={userId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-white">
                                {user.role.replace('DIRECTEUR_', '').replace('DIRECTEUR', 'DG')}
                              </Badge>
                              {user.firstName} {user.lastName}
                              <button
                                type="button"
                                onClick={() => setEditableFields({
                                  ...editableFields,
                                  personnesConcernees: editableFields.personnesConcernees.filter((id: string) => id !== userId)
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
                  </div>
                </div>

                {editableFields.type === 'INCOMING' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Partie déposante</Label>
                    <Input
                      value={editableFields.deposantInfo}
                      onChange={(e) => setEditableFields({...editableFields, deposantInfo: e.target.value})}
                      className="mt-1"
                      placeholder="Qui a déposé cette correspondance"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions à entreprendre */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Actions à entreprendre ({actions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des actions existantes */}
              {actions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>Assigné à: {action.assignedTo || 'Non assigné'}</span>
                      {action.dueDate && (
                        <>
                          <span>•</span>
                          <span>Échéance: {formatDate(action.dueDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Select 
                    value={action.status} 
                    onValueChange={(value) => {
                      const updatedActions = actions.map(a => 
                        a.id === action.id ? {...a, status: value} : a
                      );
                      setActions(updatedActions);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {/* Formulaire pour nouvelle action */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Nouvelle action</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      placeholder="Description de l'action..."
                      value={newAction.description}
                      onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Assigné à..."
                      value={newAction.assignedTo}
                      onChange={(e) => setNewAction({ ...newAction, assignedTo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="date"
                      value={newAction.dueDate}
                      onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Select value={newAction.status} onValueChange={(value: any) => setNewAction({ ...newAction, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                        <SelectItem value="COMPLETED">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddAction} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter l'action
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Commentaires ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des commentaires existants */}
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}

              {/* Formulaire pour nouveau commentaire */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Nouveau commentaire</Label>
                <Textarea
                  placeholder="Ajoutez votre commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddComment} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le commentaire
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attachements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Pièces jointes ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des attachements existants */}
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB • Uploadé par {attachment.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Upload de nouveaux fichiers */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Ajouter des pièces jointes</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
