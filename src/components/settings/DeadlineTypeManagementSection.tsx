import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useDeadlineTypes, 
  useCreateDeadlineType, 
  useUpdateDeadlineType, 
  useDeleteDeadlineType,
  type DeadlineType,
  type CreateDeadlineTypeData,
  type UpdateDeadlineTypeData
} from '@/hooks/useDeadlineTypes';

// Couleurs prédéfinies pour les types d'échéance
const PREDEFINED_COLORS = [
  { value: '#DC2626', label: 'Rouge', class: 'bg-red-600' },
  { value: '#EA580C', label: 'Orange', class: 'bg-orange-600' },
  { value: '#2563EB', label: 'Bleu', class: 'bg-blue-600' },
  { value: '#059669', label: 'Vert', class: 'bg-green-600' },
  { value: '#7C3AED', label: 'Violet', class: 'bg-purple-600' },
  { value: '#BE185D', label: 'Rose', class: 'bg-pink-600' },
  { value: '#0891B2', label: 'Cyan', class: 'bg-cyan-600' },
  { value: '#65A30D', label: 'Lime', class: 'bg-lime-600' },
  { value: '#C2410C', label: 'Orange foncé', class: 'bg-orange-700' },
  { value: '#1E40AF', label: 'Bleu foncé', class: 'bg-blue-700' }
];

interface CreateDeadlineTypeDialogProps {
  onSuccess: () => void;
}

const CreateDeadlineTypeDialog: React.FC<CreateDeadlineTypeDialogProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDeadlineTypeData>({
    name: '',
    label: '',
    color: '#2563EB',
    days: 3,
    priority: 'MEDIUM',
    description: '',
    isDefault: false,
    order: 0
  });

  const { toast } = useToast();
  const createMutation = useCreateDeadlineType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.label.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et le libellé sont requis",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      
      toast({
        title: "Type d'échéance créé",
        description: `Le type "${formData.name}" a été créé avec succès`,
      });
      
      setOpen(false);
      setFormData({
        name: '',
        label: '',
        color: '#2563EB',
        days: 3,
        priority: 'MEDIUM',
        description: '',
        isDefault: false,
        order: 0
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau type d'échéance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un type d'échéance</DialogTitle>
          <DialogDescription>
            Définissez un nouveau type d'échéance avec ses paramètres
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: URGENT, NORMAL..."
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="label">Libellé *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="ex: Urgent - 24h, Normal - 5 jours..."
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="days">Nombre de jours *</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité *</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">Élevé</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="color">Couleur</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                  } ${color.class}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle..."
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault">Type par défaut</Label>
            </div>
          </div>

          {/* Aperçu */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Aperçu :</Label>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: formData.color }}
              />
              <Badge style={{ backgroundColor: formData.color, color: 'white' }}>
                {formData.label || 'Libellé'} ({formData.days}j)
              </Badge>
              {formData.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  PAR DÉFAUT
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditDeadlineTypeDialogProps {
  deadlineType: DeadlineType;
  onSuccess: () => void;
}

const EditDeadlineTypeDialog: React.FC<EditDeadlineTypeDialogProps> = ({ deadlineType, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateDeadlineTypeData>({
    name: deadlineType.name,
    label: deadlineType.label,
    color: deadlineType.color,
    days: deadlineType.days,
    priority: deadlineType.priority,
    description: deadlineType.description,
    isDefault: deadlineType.isDefault,
    order: deadlineType.order,
    isActive: deadlineType.isActive
  });

  const { toast } = useToast();
  const updateMutation = useUpdateDeadlineType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({ id: deadlineType.id, data: formData });
      
      toast({
        title: "Type d'échéance modifié",
        description: `Le type "${formData.name}" a été modifié avec succès`,
      });
      
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la modification",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le type d'échéance</DialogTitle>
          <DialogDescription>
            Modifiez les paramètres du type "{deadlineType.name}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nom *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="edit-label">Libellé *</Label>
            <Input
              id="edit-label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-days">Nombre de jours *</Label>
              <Input
                id="edit-days"
                type="number"
                min="1"
                max="365"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="edit-priority">Priorité *</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">Élevé</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-color">Couleur</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                  } ${color.class}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-order">Ordre d'affichage</Label>
              <Input
                id="edit-order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-isDefault">Type par défaut</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-isActive">Actif</Label>
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Aperçu :</Label>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: formData.color }}
              />
              <Badge style={{ backgroundColor: formData.color, color: 'white' }}>
                {formData.label} ({formData.days}j)
              </Badge>
              {formData.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  PAR DÉFAUT
                </Badge>
              )}
              {!formData.isActive && (
                <Badge variant="destructive" className="text-xs">
                  INACTIF
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DeadlineTypeManagementSection: React.FC = () => {
  const { data: deadlineTypes = [], isLoading, refetch } = useDeadlineTypes();
  const deleteMutation = useDeleteDeadlineType();
  const { toast } = useToast();

  const handleDelete = async (deadlineType: DeadlineType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le type "${deadlineType.name}" ?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deadlineType.id);
      
      toast({
        title: "Type d'échéance supprimé",
        description: `Le type "${deadlineType.name}" a été supprimé`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'HIGH': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'MEDIUM': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'LOW': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Types d'échéance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Types d'échéance
            </CardTitle>
            <CardDescription>
              Gérez les types d'échéance disponibles pour les correspondances
            </CardDescription>
          </div>
          <CreateDeadlineTypeDialog onSuccess={refetch} />
        </div>
      </CardHeader>
      <CardContent>
        {deadlineTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun type d'échéance configuré</p>
            <p className="text-sm">Créez votre premier type d'échéance</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statistiques */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{deadlineTypes.length}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {deadlineTypes.filter(t => t.isActive).length}
                </div>
                <div className="text-sm text-green-600">Actifs</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {deadlineTypes.filter(t => t.isDefault).length}
                </div>
                <div className="text-sm text-purple-600">Par défaut</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {deadlineTypes.filter(t => t.priority === 'URGENT').length}
                </div>
                <div className="text-sm text-orange-600">Urgents</div>
              </div>
            </div>

            {/* Table des types */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlineTypes.map((deadlineType) => (
                  <TableRow key={deadlineType.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: deadlineType.color }}
                        />
                        <span className="font-medium">{deadlineType.name}</span>
                        {deadlineType.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            DÉFAUT
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{deadlineType.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deadlineType.days} jour{deadlineType.days > 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(deadlineType.priority)}
                        {deadlineType.priority}
                      </div>
                    </TableCell>
                    <TableCell>
                      {deadlineType.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EditDeadlineTypeDialog 
                          deadlineType={deadlineType} 
                          onSuccess={refetch} 
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deadlineType)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
