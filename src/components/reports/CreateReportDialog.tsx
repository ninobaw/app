
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useReports } from '@/hooks/useReports';

export const CreateReportDialog = () => {
  const [open, setOpen] = useState(false);
  const { createReport, isCreating } = useReports();
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    frequency: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      return;
    }

    const reportData = {
      name: formData.name,
      type: formData.type,
      config: {},
      frequency: formData.frequency || undefined,
    };

    createReport(reportData, {
      onSuccess: () => {
        setFormData({
          name: '',
          type: '',
          frequency: '',
        });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-aviation-sky hover:bg-aviation-sky-dark">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau rapport</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du rapport *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Rapport mensuel d'activité"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type de rapport *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOCUMENT_USAGE">Utilisation des documents</SelectItem>
                <SelectItem value="USER_ACTIVITY">Activité des utilisateurs</SelectItem>
                <SelectItem value="ACTION_STATUS">Statut des actions</SelectItem>
                <SelectItem value="PERFORMANCE">Performance</SelectItem>
                <SelectItem value="CUSTOM">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="frequency">Fréquence</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Quotidien</SelectItem>
                <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                <SelectItem value="MONTHLY">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
