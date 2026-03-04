import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale'; // Import all necessary locales
import { useActions } from '@/hooks/useActions';
import { useDocuments } from '@/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { UserMultiSelect } from '@/components/shared/UserMultiSelect'; // Import UserMultiSelect
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export const CreateActionForm = () => {
  const navigate = useNavigate();
  const { createAction, isCreating } = useActions();
  const { documents } = useDocuments();
  const { user } = useAuth(); // Get user to access language preference
  const userLanguage = user?.language || 'fr'; // Default to 'fr'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: [] as string[],
    due_date: undefined as Date | undefined,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    parent_document_id: '',
    estimated_hours: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.due_date || formData.assigned_to.length === 0) { // Added check for assigned_to
      return;
    }

    const actionData = {
      title: formData.title,
      description: formData.description,
      assigned_to: formData.assigned_to,
      due_date: formData.due_date.toISOString(),
      priority: formData.priority,
      parent_document_id: formData.parent_document_id || undefined,
      estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
    };

    createAction(actionData, {
      onSuccess: () => {
        navigate('/actions');
      }
    });
  };

  // Helper to get date-fns locale object
  const getLocaleObject = (locale: string) => {
    switch (locale) {
      case 'fr': return fr;
      case 'en': return enUS;
      case 'ar': return ar;
      default: return fr; // Default to French
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Créer une nouvelle action</CardTitle>
          <Button variant="outline" onClick={() => navigate('/actions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HIGH">Élevé</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="parent_document_id">Document lié</Label>
              <Select value={formData.parent_document_id} onValueChange={(value) => setFormData({ ...formData, parent_document_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
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
            <Label>Date d'échéance *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, "PPP", { locale: getLocaleObject(userLanguage) }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData({ ...formData, due_date: date })}
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

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/actions')}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !formData.title || !formData.description || !formData.due_date || formData.assigned_to.length === 0}
              className="bg-aviation-sky hover:bg-aviation-sky-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Création...' : 'Créer l\'action'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};