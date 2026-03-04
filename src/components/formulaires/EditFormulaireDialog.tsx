import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileSpreadsheet } from 'lucide-react';
import { useFormulaires, FormulaireData } from '@/hooks/useFormulaires';
import { useToast } from '@/hooks/use-toast';
import { Airport } from '@/shared/types';

interface EditFormulaireDialogProps {
  formulaire: FormulaireData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditFormulaireDialog: React.FC<EditFormulaireDialogProps> = ({ formulaire, open, onOpenChange }) => {
  const { updateFormulaire, isUpdating } = useFormulaires(); // Assuming updateFormulaire mutation exists
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    airport: 'ENFIDHA' as Airport,
    category: '',
    description: '',
    instructions: '',
  });

  useEffect(() => {
    if (formulaire) {
      const content = formulaire.content ? JSON.parse(formulaire.content) : {};
      setFormData({
        title: formulaire.title || '',
        code: content.code || '',
        airport: formulaire.airport || 'ENFIDHA',
        category: content.category || '',
        description: content.description || '',
        instructions: content.instructions || '',
      });
    }
  }, [formulaire]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulaire) return;

    if (!formData.title.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Le nom du formulaire est requis.',
        variant: 'destructive',
      });
      return;
    }

    const updatedContent = JSON.stringify({
      code: formData.code,
      category: formData.category,
      description: formData.description,
      instructions: formData.instructions,
    });

    updateFormulaire({
      id: formulaire.id,
      title: formData.title.trim(),
      content: updatedContent,
      airport: formData.airport,
      // Other fields like status, author_id are not typically updated via this form
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le formulaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Nom du formulaire *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Entrez le nom du formulaire"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code formulaire</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="FORM-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="airport">Aéroport *</Label>
              <Select value={formData.airport} onValueChange={(value: Airport) => setFormData({ ...formData, airport: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un aéroport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                  <SelectItem value="MONASTIR">Monastir</SelectItem>
                  <SelectItem value="GENERALE">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="securite">Sécurité</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="operations">Opérations</SelectItem>
                  <SelectItem value="qualite">Qualité</SelectItem>
                  <SelectItem value="environnement">Environnement</SelectItem>
                  <SelectItem value="rh">Ressources Humaines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du formulaire</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du formulaire et de son utilisation..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions de remplissage</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Instructions pour remplir correctement ce formulaire..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};