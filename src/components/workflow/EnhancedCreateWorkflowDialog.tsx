import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, User, AlertCircle, CheckCircle, Users, UserCheck, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface EnhancedCreateWorkflowDialogProps {
  correspondenceId: string;
  correspondenceSubject: string;
  onWorkflowCreated?: (workflowId: string) => void;
  trigger?: React.ReactNode;
}

const EnhancedCreateWorkflowDialog: React.FC<EnhancedCreateWorkflowDialogProps> = ({
  correspondenceId,
  correspondenceSubject,
  onWorkflowCreated,
  trigger
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // États pour les sélections
  const [directeurs, setDirecteurs] = useState<any[]>([]);
  const [superviseurs, setSuperviseurs] = useState<any[]>([]);
  const [directeursGeneraux, setDirecteursGeneraux] = useState<any[]>([]);
  
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [selectedDGId, setSelectedDGId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [existingWorkflow, setExistingWorkflow] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchUsers();
      checkExistingWorkflow();
    }
  }, [open, correspondenceId]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      if (response.data.success) {
        const users = response.data.data;
        
        // Filtrer par rôles
        setDirecteurs(users.filter((u: any) => 
          ['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(u.role)
        ));
        
        setSuperviseurs(users.filter((u: any) => 
          u.role === 'SUPERVISOR_BUREAU_ORDRE'
        ));
        
        setDirecteursGeneraux(users.filter((u: any) => 
          u.role === 'DIRECTEUR_GENERAL'
        ));

        // Sélection automatique si un seul choix
        if (users.filter((u: any) => u.role === 'DIRECTEUR_GENERAL').length === 1) {
          setSelectedDGId(users.find((u: any) => u.role === 'DIRECTEUR_GENERAL')._id);
        }
        
        if (users.filter((u: any) => u.role === 'SUPERVISOR_BUREAU_ORDRE').length === 1) {
          setSelectedSupervisorId(users.find((u: any) => u.role === 'SUPERVISOR_BUREAU_ORDRE')._id);
        }
      }
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs",
        variant: "destructive"
      });
    }
  };

  const checkExistingWorkflow = async () => {
    try {
      // Vérifier s'il existe déjà un workflow pour cette correspondance
      const response = await api.get(`/api/enhanced-workflow?correspondenceId=${correspondenceId}`);
      if (response.data.success && response.data.data.length > 0) {
        setExistingWorkflow(response.data.data[0]);
      }
    } catch (error) {
      console.error('Erreur vérification workflow existant:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedDirectorId || !selectedDGId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un directeur et un directeur général",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/enhanced-workflow/create-by-bureau-ordre', {
        correspondenceId,
        assignedDirectorId: selectedDirectorId,
        superviseurBureauOrdreId: selectedSupervisorId || undefined,
        directeurGeneralId: selectedDGId,
        priority
      });

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Workflow créé et assigné avec succès"
        });
        onWorkflowCreated?.(response.data.data._id);
        setOpen(false);
        
        // Reset form
        setSelectedDirectorId('');
        setSelectedSupervisorId('');
        setSelectedDGId('');
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

  // Vérifier si l'utilisateur peut créer un workflow
  const canCreateWorkflow = user && ['BUREAU_ORDRE', 'SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR'].includes(user.role);

  if (!canCreateWorkflow) {
    return null; // Ne pas afficher le bouton si pas autorisé
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Créer Workflow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Créer un Workflow de Traitement Complet
          </DialogTitle>
          <DialogDescription>
            Initiez le processus complet de traitement avec tous les acteurs concernés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la correspondance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Correspondance à Traiter</CardTitle>
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
                  Workflow Existant Détecté
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
            <div className="space-y-6">
              {/* Sélection des acteurs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assignation des Responsables
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez les personnes qui interviendront dans le processus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Directeur/Sous-directeur assigné */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Directeur/Sous-directeur Responsable *
                    </label>
                    <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le directeur responsable" />
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
                        Aucun directeur trouvé dans le système
                      </p>
                    )}
                  </div>

                  {/* Superviseur Bureau d'Ordre */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      Superviseur Bureau d'Ordre
                    </label>
                    <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le superviseur (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun superviseur spécifique</SelectItem>
                        {superviseurs.map((superviseur) => (
                          <SelectItem key={superviseur._id} value={superviseur._id}>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{superviseur.firstName} {superviseur.lastName}</span>
                              <Badge variant="outline" className="text-xs">
                                Superviseur
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Directeur Général */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-600" />
                      Directeur Général *
                    </label>
                    <Select value={selectedDGId} onValueChange={setSelectedDGId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le Directeur Général" />
                      </SelectTrigger>
                      <SelectContent>
                        {directeursGeneraux.map((dg) => (
                          <SelectItem key={dg._id} value={dg._id}>
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4" />
                              <span>{dg.firstName} {dg.lastName}</span>
                              <Badge variant="outline" className="text-xs">
                                DG
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {directeursGeneraux.length === 0 && (
                      <p className="text-xs text-red-500">
                        Aucun Directeur Général trouvé dans le système
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sélection de la priorité */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Priorité du Traitement</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Aperçu du processus complet */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">Processus de Traitement Complet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <p className="font-medium">Bureau d'Ordre crée et assigne</p>
                        <p className="text-xs text-blue-600">Correspondance assignée au directeur responsable</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <p className="font-medium">Directeur rédige proposition</p>
                        <p className="text-xs text-blue-600">Proposition de réponse avec pièces jointes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <p className="font-medium">DG révise et commente</p>
                        <p className="text-xs text-blue-600">Chat intégré pour va-et-vient DG ↔ Directeur</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <p className="font-medium">Révisions multiples si nécessaire</p>
                        <p className="text-xs text-blue-600">Versions trackées avec feedback détaillé</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                      <div>
                        <p className="font-medium">DG approuve la version finale</p>
                        <p className="text-xs text-blue-600">Notification automatique au superviseur</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</div>
                      <div>
                        <p className="font-medium">Superviseur prépare et envoie</p>
                        <p className="text-xs text-blue-600">Réponse finale formatée et envoyée</p>
                      </div>
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
                disabled={loading || !selectedDirectorId || !selectedDGId}
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
                    Créer le Workflow Complet
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

export default EnhancedCreateWorkflowDialog;
