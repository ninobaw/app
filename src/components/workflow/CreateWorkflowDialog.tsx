import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface CreateWorkflowDialogProps {
  correspondenceId: string;
  correspondenceSubject: string;
  onWorkflowCreated?: (workflowId: string) => void;
  trigger?: React.ReactNode;
}

const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  correspondenceId,
  correspondenceSubject,
  onWorkflowCreated,
  trigger
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directeurs, setDirecteurs] = useState<any[]>([]);
  const [selectedDirecteurId, setSelectedDirecteurId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [existingWorkflow, setExistingWorkflow] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchDirecteurs();
      checkExistingWorkflow();
    }
  }, [open, correspondenceId]);

  const fetchDirecteurs = async () => {
    try {
      const response = await api.get('/api/users?role=DIRECTEUR_GENERAL');
      if (response.data.success) {
        setDirecteurs(response.data.data);
        // Sélectionner automatiquement s'il n'y a qu'un DG
        if (response.data.data.length === 1) {
          setSelectedDirecteurId(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Erreur récupération directeurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des directeurs",
        variant: "destructive"
      });
    }
  };

  const checkExistingWorkflow = async () => {
    try {
      // Vérifier s'il existe déjà un workflow pour cette correspondance
      const response = await api.get(`/api/workflow?correspondenceId=${correspondenceId}`);
      if (response.data.success && response.data.data.length > 0) {
        setExistingWorkflow(response.data.data[0]);
      }
    } catch (error) {
      console.error('Erreur vérification workflow existant:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedDirecteurId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un Directeur Général",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/workflow/create', {
        correspondenceId,
        directeurGeneralId: selectedDirecteurId,
        priority
      });

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Workflow créé avec succès"
        });
        onWorkflowCreated?.(response.data.data._id);
        setOpen(false);
        
        // Reset form
        setSelectedDirecteurId('');
        setPriority('MEDIUM');
      }
    } catch (error: any) {
      console.error('Erreur création workflow:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création du workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      LOW: 'Faible',
      MEDIUM: 'Moyenne',
      HIGH: 'Élevée',
      URGENT: 'Urgente'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Créer un Workflow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Créer un Workflow de Traitement
          </DialogTitle>
          <DialogDescription>
            Initiez le processus de traitement pour cette correspondance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la correspondance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Correspondance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{correspondenceSubject}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {correspondenceId}</p>
            </CardContent>
          </Card>

          {/* Vérification workflow existant */}
          {existingWorkflow && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                  <AlertCircle className="w-4 h-4" />
                  Workflow Existant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700">
                  Un workflow existe déjà pour cette correspondance.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-orange-800 border-orange-300">
                    {existingWorkflow.currentStatus}
                  </Badge>
                  <span className="text-xs text-orange-600">
                    Créé le {new Date(existingWorkflow.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-orange-700 border-orange-300 hover:bg-orange-100"
                  onClick={() => {
                    onWorkflowCreated?.(existingWorkflow._id);
                    setOpen(false);
                  }}
                >
                  Voir le workflow existant
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Configuration du nouveau workflow */}
          {!existingWorkflow && (
            <div className="space-y-4">
              {/* Sélection du Directeur Général */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Directeur Général</label>
                <Select value={selectedDirecteurId} onValueChange={setSelectedDirecteurId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le Directeur Général" />
                  </SelectTrigger>
                  <SelectContent>
                    {directeurs.map((directeur) => (
                      <SelectItem key={directeur._id} value={directeur._id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{directeur.firstName} {directeur.lastName}</span>
                          <Badge variant="outline" className="text-xs">
                            {directeur.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {directeurs.length === 0 && (
                  <p className="text-xs text-red-500">
                    Aucun Directeur Général trouvé dans le système
                  </p>
                )}
              </div>

              {/* Sélection de la priorité */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(p).split(' ')[0]}`} />
                          {getPriorityLabel(p)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aperçu du processus */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">Processus de Traitement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>1. Révision et consigne du Directeur Général</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>2. Assignation à une personne responsable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>3. Rédaction de la proposition de réponse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>4. Approbation ou révision par le DG</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>5. Envoi de la réponse finale</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            {!existingWorkflow && (
              <Button 
                onClick={handleCreateWorkflow} 
                disabled={loading || !selectedDirecteurId}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Créer le Workflow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkflowDialog;
