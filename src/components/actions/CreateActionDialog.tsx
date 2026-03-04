import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useActions } from '@/hooks/useActions';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import { UserMultiSelect } from '@/components/shared/UserMultiSelect';
import { useAuth } from '@/contexts/AuthContext';

export const CreateActionDialog = () => {
  const { createAction, isCreating } = useActions();
  const { users } = useUsers();
  const { user } = useAuth();
  const userLanguage = user?.language || 'fr';
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    assigned_to: [] as string[],
    due_date: new Date(),
    estimated_hours: '',
  });

  const [dateOpen, setDateOpen] = useState(false);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || formData.assigned_to.length === 0) {
      return;
    }

    const actionData = {
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
      due_date: formData.due_date.toISOString(),
    };

    createAction(actionData, {
      onSuccess: () => {
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assigned_to: [],
          due_date: new Date(),
          estimated_hours: '',
        });
        setOpen(false);
      }
    });
  }, [createAction, formData, setOpen]);

  const getLocaleObject = (locale: string) => {
    switch (locale) {
      case 'fr': return fr;
      case 'en': return enUS;
      case 'ar': return ar;
      default: return fr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-aviation-sky hover:bg-aviation-sky-dark">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Action
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle action</DialogTitle>
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
              <Label htmlFor="estimated_hours">Heures estimées</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="Ex: 8"
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
            <Label htmlFor="assigned_to">Assigné à</Label>
            <UserMultiSelect
              selectedUserIds={formData.assigned_to}
              onUserIdsChange={(ids) => setFormData({ ...formData, assigned_to: ids })}
              placeholder="Sélectionner un ou plusieurs utilisateurs"
              disabled={isCreating}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating || !formData.title || !formData.description || formData.assigned_to.length === 0}>
              {isCreating ? 'Création...' : 'Créer l\'action'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};