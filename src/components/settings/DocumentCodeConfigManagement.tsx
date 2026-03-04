import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, XCircle } from 'lucide-react';
import { useDocumentCodeConfig } from '@/hooks/useDocumentCodeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DocumentCodeComponent } from '@/shared/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ItemFormState {
  code: string;
  label: string;
  description: string;
}

interface EditingState {
  category: keyof Omit<DocumentCodeConfig, 'id' | 'sequenceCounters' | 'createdAt' | 'updatedAt'> | null;
  item: DocumentCodeComponent | null;
  index: number | null;
}

export const DocumentCodeConfigManagement: React.FC = () => {
  const { config, isLoading, isUpdating, updateDocumentCodeConfig } = useDocumentCodeConfig();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [newDocType, setNewDocType] = useState<ItemFormState>({ code: '', label: '', description: '' });
  const [newDepartment, setNewDepartment] = useState<ItemFormState>({ code: '', label: '', description: '' });
  const [newSubDepartment, setNewSubDepartment] = useState<ItemFormState>({ code: '', label: '', description: '' });
  const [newLanguage, setNewLanguage] = useState<ItemFormState>({ code: '', label: '', description: '' });
  const [newScope, setNewScope] = useState<ItemFormState>({ code: '', label: '', description: '' });

  const [editing, setEditing] = useState<EditingState>({ category: null, item: null, index: null });
  const [editForm, setEditForm] = useState<ItemFormState>({ code: '', label: '', description: '' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const canManage = hasPermission('manage_settings'); // Check for 'manage_settings' permission

  useEffect(() => {
    if (editing.item) {
      setEditForm({
        code: editing.item.code,
        label: editing.item.label,
        description: editing.item.description || '',
      });
      setIsEditDialogOpen(true);
    } else {
      setIsEditDialogOpen(false);
    }
  }, [editing]);

  const handleAddItem = (category: keyof Omit<DocumentCodeConfig, 'id' | 'sequenceCounters' | 'createdAt' | 'updatedAt'>, newItem: ItemFormState, resetForm: () => void) => {
    if (!canManage) {
      toast({ title: "Permission refusée", description: "Vous n'avez pas la permission de modifier la configuration.", variant: "destructive" });
      return;
    }
    if (!newItem.code.trim() || !newItem.label.trim()) {
      toast({ title: "Erreur", description: "Le code et le libellé sont obligatoires.", variant: "destructive" });
      return;
    }
    if (config) {
      const currentItems = config[category] as DocumentCodeComponent[];
      if (currentItems.some(item => item.code.toUpperCase() === newItem.code.trim().toUpperCase())) {
        toast({ title: "Erreur", description: `Le code '${newItem.code.trim()}' existe déjà dans cette catégorie.`, variant: "destructive" });
        return;
      }
      const updatedConfig = {
        ...config,
        [category]: [...currentItems, { ...newItem, code: newItem.code.trim().toUpperCase() }]
      };
      updateDocumentCodeConfig(updatedConfig);
      resetForm();
    }
  };

  const handleEditItem = () => {
    if (!canManage) {
      toast({ title: "Permission refusée", description: "Vous n'avez pas la permission de modifier la configuration.", variant: "destructive" });
      return;
    }
    if (!editing.category || editing.index === null || !config) return;
    if (!editForm.code.trim() || !editForm.label.trim()) {
      toast({ title: "Erreur", description: "Le code et le libellé sont obligatoires.", variant: "destructive" });
      return;
    }

    const currentItems = [...(config[editing.category] as DocumentCodeComponent[])];
    
    // Check for duplicate code if code was changed
    if (editForm.code.trim().toUpperCase() !== editing.item?.code.toUpperCase() && currentItems.some((item, idx) => idx !== editing.index && item.code.toUpperCase() === editForm.code.trim().toUpperCase())) {
      toast({ title: "Erreur", description: `Le code '${editForm.code.trim()}' existe déjà dans cette catégorie.`, variant: "destructive" });
      return;
    }

    currentItems[editing.index] = { ...editForm, code: editForm.code.trim().toUpperCase() };
    const updatedConfig = { ...config, [editing.category]: currentItems };
    updateDocumentCodeConfig(updatedConfig);
    setEditing({ category: null, item: null, index: null });
    setIsEditDialogOpen(false);
  };

  const handleDeleteItem = (category: keyof Omit<DocumentCodeConfig, 'id' | 'sequenceCounters' | 'createdAt' | 'updatedAt'>, index: number) => {
    if (!canManage) {
      toast({ title: "Permission refusée", description: "Vous n'avez pas la permission de modifier la configuration.", variant: "destructive" });
      return;
    }
    if (config && window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      const currentItems = [...(config[category] as DocumentCodeComponent[])];
      currentItems.splice(index, 1);
      const updatedConfig = { ...config, [category]: currentItems };
      updateDocumentCodeConfig(updatedConfig);
    }
  };

  const renderCategory = (
    category: keyof Omit<DocumentCodeConfig, 'id' | 'sequenceCounters' | 'createdAt' | 'updatedAt'>,
    title: string,
    newItemState: ItemFormState,
    setNewItemState: React.Dispatch<React.SetStateAction<ItemFormState>>,
    placeholderCode: string,
    placeholderLabel: string
  ) => {
    const items = config?.[category] as DocumentCodeComponent[] || [];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>Gérer les éléments de cette catégorie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Aucun élément défini.</p>
            ) : (
              items.map((item, index) => (
                <div key={item.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{item.label} <span className="text-sm text-gray-500">({item.code})</span></p>
                    {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing({ category, item, index })}
                      disabled={!canManage || isUpdating}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(category, index)}
                      disabled={!canManage || isUpdating}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <Label>Ajouter un nouvel élément</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder={placeholderCode}
                value={newItemState.code}
                onChange={(e) => setNewItemState(prev => ({ ...prev, code: e.target.value }))}
                disabled={!canManage || isUpdating}
              />
              <Input
                placeholder={placeholderLabel}
                value={newItemState.label}
                onChange={(e) => setNewItemState(prev => ({ ...prev, label: e.target.value }))}
                disabled={!canManage || isUpdating}
              />
              <Input
                placeholder="Description (optionnel)"
                value={newItemState.description}
                onChange={(e) => setNewItemState(prev => ({ ...prev, description: e.target.value }))}
                disabled={!canManage || isUpdating}
              />
            </div>
            <Button
              type="button"
              onClick={() => handleAddItem(category, newItemState, () => setNewItemState({ code: '', label: '', description: '' }))}
              disabled={!canManage || isUpdating || !newItemState.code.trim() || !newItemState.label.trim()}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de la configuration des codes documentaires...</p>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card className="p-8 text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour gérer cette section.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gestion des Codes Documentaires</h2>
      <p className="text-gray-600">Définissez et ajustez les composants utilisés pour la génération automatique des codes documentaires (ex: départements, types de documents, langues).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCategory('documentTypes', 'Types de Documents', newDocType, setNewDocType, 'Ex: FM, PV', 'Formulaire, Procès-Verbal')}
        {renderCategory('departments', 'Départements', newDepartment, setNewDepartment, 'Ex: QMS, OPS', 'Qualité, Opérations')}
        {renderCategory('subDepartments', 'Sous-Départements / Unités', newSubDepartment, setNewSubDepartment, 'Ex: MAINT, IT', 'Maintenance, Informatique')}
        {renderCategory('languages', 'Langues', newLanguage, setNewLanguage, 'Ex: FR, EN', 'Français, Anglais')}
        {renderCategory('scopes', 'Scopes (Aéroports)', newScope, setNewScope, 'Ex: NBE, MIR', 'Enfidha, Monastir')}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'élément</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Libellé</Label>
              <Input
                id="edit-label"
                value={editForm.label}
                onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optionnel)</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={isUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Annuler</Button>
            <Button onClick={handleEditItem} disabled={isUpdating}>
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};