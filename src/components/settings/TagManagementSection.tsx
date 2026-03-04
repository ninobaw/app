import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Tag as TagIcon, Palette, Power, PowerOff } from 'lucide-react';
import { useAllTags, useUpdateTag, useDeleteTag, useToggleTag, getTagColors, Tag } from '@/hooks/useTags';
import { toast } from 'sonner';
import { useTagDialogStore } from '@/hooks/useTagDialogStore';

interface EditTagDialogProps {
  tag: Tag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTagDialog: React.FC<EditTagDialogProps> = ({ tag, open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const updateTag = useUpdateTag();
  const tagColors = getTagColors();

  React.useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
      setDescription(tag.description || '');
      setIsActive(tag.isActive ?? true);
    }
  }, [tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tag || !name.trim()) {
      toast.error('Le nom du tag est requis');
      return;
    }

    try {
      await updateTag.mutateAsync({
        id: tag.id,
        name: name.trim(),
        color,
        description: description.trim() || undefined,
        isActive,
      });
      
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Modifier le tag
          </DialogTitle>
          <DialogDescription>
            Modifiez les propriétés du tag "{tag.name}".
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tag-name">Nom du tag *</Label>
            <Input
              id="edit-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: urgent, important, confidentiel..."
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tag-color">Couleur</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    {tagColors.find(c => c.value === color)?.label || 'Couleur personnalisée'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tagColors.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorOption.value }}
                      />
                      {colorOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tag-description">Description (optionnelle)</Label>
            <Textarea
              id="edit-tag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du tag..."
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-tag-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="edit-tag-active">Tag actif</Label>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Palette className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Aperçu :</span>
            <Badge 
              style={{ 
                backgroundColor: color + '20',
                color: color,
                borderColor: color + '40'
              }}
              className={`border ${!isActive ? 'opacity-50' : ''}`}
            >
              {name || 'Nom du tag'}
            </Badge>
            {!isActive && (
              <span className="text-xs text-gray-500">(Inactif)</span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateTag.isPending}>
              {updateTag.isPending ? 'Modification...' : 'Modifier le tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface TagManagementSectionProps {
  onCreateTag?: () => void;
}

const TagManagementSection: React.FC<TagManagementSectionProps> = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const { data: tags, isLoading, error } = useAllTags();
  const deleteTag = useDeleteTag();
  const toggleTag = useToggleTag();
  const { open: openTagDialog, isOpen: isCreateDialogOpen } = useTagDialogStore();

  // Debug logs
  React.useEffect(() => {
    console.log('TagManagementSection: tags data:', tags);
  }, [tags]);

  // Debug: Log the store
  React.useEffect(() => {
    console.log('TagManagementSection: useTagDialogStore available:', !!openTagDialog);
  }, [openTagDialog]);

  const handleEditTag = (tag: Tag) => {
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };

  const handleToggleTag = async (tag: Tag) => {
    const action = tag.isActive ? 'désactiver' : 'activer';
    if (window.confirm(`Êtes-vous sûr de vouloir ${action} le tag "${tag.name}" ?`)) {
      try {
        await toggleTag.mutateAsync(tag.id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    const confirmMessage = `⚠️ ATTENTION: Suppression définitive du tag "${tag.name}"

Cette action est IRRÉVERSIBLE et supprimera définitivement le tag de la base de données.

Si le tag est utilisé dans des correspondances, la suppression sera refusée.

Êtes-vous absolument sûr de vouloir continuer ?`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteTag.mutateAsync(tag.id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleCreateDialogOpen = () => {
    console.log('TagManagementSection: handleCreateDialogOpen called');
    console.log('TagManagementSection: Opening dialog via store');
    if (!isCreateDialogOpen) {
      openTagDialog();
    } else {
      console.log('TagManagementSection: Dialog already open, ignoring');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Gestion des Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Chargement des tags...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Gestion des Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Erreur lors du chargement des tags</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="w-5 h-5" />
          Gestion des Tags
        </CardTitle>
        <CardDescription>
          Gérez les tags prédéfinis disponibles pour les correspondances. Seuls les tags actifs sont visibles aux utilisateurs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {tags?.length || 0} tag(s) configuré(s)
          </div>
          <Button onClick={handleCreateDialogOpen} disabled={isCreateDialogOpen} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau tag
          </Button>
        </div>

        {tags && tags.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color + '40'
                      }}
                      className="border"
                    >
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {tag.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tag.isActive ? 'default' : 'secondary'}>
                      {tag.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {tag.createdBy ? 
                        `${tag.createdBy.firstName} ${tag.createdBy.lastName}` : 
                        '-'
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTag(tag)}
                        title="Modifier le tag"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTag(tag)}
                        className={tag.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                        title={tag.isActive ? "Désactiver le tag" : "Activer le tag"}
                      >
                        {tag.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        className="text-red-600 hover:text-red-700"
                        title="Supprimer définitivement le tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun tag configuré</p>
            <p className="text-sm">Créez votre premier tag pour commencer</p>
          </div>
        )}

        <EditTagDialog 
          tag={selectedTag}
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen} 
        />
      </CardContent>
    </Card>
  );
};

export default TagManagementSection;
