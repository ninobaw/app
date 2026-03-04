import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useActions, ActionData } from '@/hooks/useActions';
import { useDocuments } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';
import { UserMultiSelect } from '@/components/shared/UserMultiSelect';
import { useAuth } from '@/contexts/AuthContext';

interface EditActionDialogProps {
  action: ActionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditActionDialog: React.FC<EditActionDialogProps> = ({ action, open, onOpenChange }) => {
  const { updateAction, isUpdating } = useActions();
  const { documents } = useDocuments();
  const { user } = useAuth();
  const userLanguage = user?.language || 'fr';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: [] as string[],
    due_date: undefined as Date | undefined,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    parent_document_id: '',
    progress: 0,
    estimated_hours: '',
    actual_hours: '',
  });

  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title || '',
        description: action.description || '',
        assigned_to: action.assigned_to || [],
        due_date: action.due_date ? new Date(action.due_date) : undefined,
        priority: action.priority || 'MEDIUM',
        status: action.status || 'PENDING',
        parent_document_id: action.parent_document_id || '',
        progress: action.progress || 0,
        estimated_hours: action.estimated_hours?.toString() || '',
        actual_hours: action.actual_hours?.toString() || '',
      });
    }
  }, [action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!action) return;

    if (!formData.title || !formData.description || !formData.due_date || formData.assigned_to.length === 0) {
      return;
    }

    const updatedData = {
      title: formData.title,
      description: formData.description,
      assigned_to: formData.assigned_to,
      due_date: formData.due_date.toISOString(),
      priority: formData.priority,
      status: formData.status,
      parent_document_id: formData.parent_document_id || undefined,
      progress: formData.progress,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
      actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : undefined,
    };

    updateAction({ id: action.id, ...updatedData }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const getLocaleObject = (locale: string) => {
    switch (locale) {
      case 'fr': return fr;
      case 'en': return enUS;
      case 'ar': return ar;
      default: return fr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'action</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'action"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée de l'action"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimated_hours">Heures estimées</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="Ex: 8"
              />
            </div>
            <div>
              <Label htmlFor="actual_hours">Heures réelles</Label>
              <Input
                id="actual_hours"
                type="number"
                value={formData.actual_hours}
                onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                placeholder="Ex: 7.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">Date d'échéance</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, "PPP", { locale: getLocaleObject(userLanguage) }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, due_date: date });
                      setDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="parent_document_id">Document lié</Label>
            <Select value={formData.parent_document_id} onValueChange={(value) => setFormData({ ...formData, parent_document_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun document lié</SelectItem>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigné à</Label>
            <UserMultiSelect
              selectedUserIds={formData.assigned_to}
              onUserIdsChange={(ids) => setFormData({ ...formData, assigned_to: ids })}
              placeholder="Sélectionner un ou plusieurs utilisateurs"
              disabled={isUpdating}
            />
          </div>

          <div>
            <Label htmlFor="progress">Progression (%)</Label>
            <Input
              id="progress"
              type="number"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              min={0}
              max={100}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating || !formData.title || !formData.description || formData.assigned_to.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};