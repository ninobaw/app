import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Eye, Edit, Trash2, FileDown, Info, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, AlertCircle, MessageSquare, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CorrespondanceDetailDialog } from './CorrespondanceDetailDialog';
import { ResponseDraftDialog } from './ResponseDraftDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { InformatifCorrespondanceTracker } from './InformatifCorrespondanceTracker';
import { CorrespondanceWorkflowDialog } from './CorrespondanceWorkflowDialog';
import { CorrespondanceLinkButton } from './CorrespondanceLinkButton';
import { formatDate, getAbsoluteFilePath, truncateText } from '@/shared/utils';
import type { CorrespondanceData } from '@/hooks/useCorrespondances';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import CreateWorkflowDialog from '@/components/workflow/CreateWorkflowDialog';
import EnhancedCreateWorkflowDialog from '@/components/workflow/EnhancedCreateWorkflowDialog';

interface CorrespondancesListProps {
  correspondances: CorrespondanceData[];
  isLoading: boolean;
  onTagFilter?: (tag: string) => void;
  onEdit?: (correspondance: CorrespondanceData) => void;
}

export const CorrespondancesList = ({ correspondances, isLoading, onTagFilter, onEdit }: CorrespondancesListProps) => {
  const { deleteCorrespondance, isDeleting } = useCorrespondances();
  const { toast } = useToast();
  const { data: tags } = useTags();
  const { user } = useAuth();

  const [correspondanceToDelete, setCorrespondanceToDelete] = useState<string>('');
  const [correspondanceToDeleteSubject, setCorrespondanceToDeleteSubject] = useState<string>('');
  const [selectedInformatifCorrespondance, setSelectedInformatifCorrespondance] = useState<CorrespondanceData | null>(null);
  const [selectedCorrespondance, setSelectedCorrespondance] = useState<CorrespondanceData | null>(null);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [correspondanceForDraft, setCorrespondanceForDraft] = useState<CorrespondanceData | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [correspondanceForWorkflow, setCorrespondanceForWorkflow] = useState<CorrespondanceData | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Display 10 items per page

  const totalPages = Math.ceil(correspondances.length / itemsPerPage);
  const currentItems = correspondances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des correspondances...</p>
      </Card>
    );
  }

  if (correspondances.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune correspondance trouvée</h3>
        <p className="text-gray-500">Il n'y a aucune correspondance correspondant à vos critères de recherche.</p>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'REPLIED': return 'bg-green-100 text-green-800 border-green-300';
      case 'INFORMATIF': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ENTRANT':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" title="Entrant" />;
      case 'SORTANT':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" title="Sortant" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" title="Correspondance" />;
    }
  };

  const handleEditButtonClick = (correspondance: CorrespondanceData) => {
    // Appeler la fonction onEdit passée en prop
    if (onEdit) {
      onEdit(correspondance);
    }
  };
  const handleDeleteClick = (id: string, subject: string) => {
    setCorrespondanceToDelete(id);
    setCorrespondanceToDeleteSubject(subject);
  };

  const handleDeleteConfirm = async () => {
    if (correspondanceToDelete) {
      try {
        await deleteCorrespondance.mutateAsync(correspondanceToDelete);
        toast({
          title: "Correspondance supprimée",
          description: "La correspondance a été supprimée avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la correspondance.",
          variant: "destructive",
        });
      }
    }
    setCorrespondanceToDelete('');
    setCorrespondanceToDeleteSubject('');
  };

  const handleCreateDraft = (correspondance: CorrespondanceData) => {
    setCorrespondanceForDraft(correspondance);
    setDraftDialogOpen(true);
  };

  const handleDraftSubmitted = () => {
    // Rafraîchir la liste des correspondances si nécessaire
    toast({
      title: "Draft soumis",
      description: "Votre draft de réponse a été soumis au Directeur Général.",
    });
  };

  // Vérifier si l'utilisateur peut créer des drafts
  const canCreateDraft = user?.role === 'DIRECTEUR' || user?.role === 'SOUS_DIRECTEUR';

  const getTagColor = (tagName: string) => {
    // Fallback colors if tag not found
    const colors = [
      { backgroundColor: '#3B82F620', color: '#3B82F6', borderColor: '#3B82F640' },
      { backgroundColor: '#22C55E20', color: '#22C55E', borderColor: '#22C55E40' },
      { backgroundColor: '#A855F720', color: '#A855F7', borderColor: '#A855F740' },
      { backgroundColor: '#F97316220', color: '#F97316', borderColor: '#F9731640' },
    ];
    return colors[tagName.length % colors.length];
  };

  const handleTagFilter = (tag: string) => {
    if (onTagFilter) {
      onTagFilter(tag);
    } else {
      console.log('Tag filter:', tag);
    }
  };

  // Fonction pour déterminer si une correspondance est non répondue
  const isUnresponded = (correspondance: CorrespondanceData) => {
    const unrespondedStatuses = ['En attente', 'Nouveau', 'Reçu', 'À traiter', 'PENDING'];
    return unrespondedStatuses.includes(correspondance.status);
  };

  // Fonction pour obtenir les classes CSS avec animation pour les correspondances non répondues
  const getRowClasses = (correspondance: CorrespondanceData) => {
    const baseClasses = "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-aviation-sky/5 transition-all duration-200 border-b border-gray-100";
    
    if (isUnresponded(correspondance)) {
      return `${baseClasses} unresponded-row`;
    }
    
    return baseClasses;
  };

  // Fonction pour calculer les jours restants avant échéance
  const getDaysUntilDeadline = (deadline: string | Date) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fonction pour obtenir la couleur de l'échéance selon l'urgence
  const getDeadlineColor = (deadline: string | Date, status: string) => {
    if (!deadline || ['REPLIED', 'CLOTURER'].includes(status)) {
      return 'text-gray-500';
    }
    
    const daysRemaining = getDaysUntilDeadline(deadline);
    if (daysRemaining === null) return 'text-gray-500';
    
    if (daysRemaining < 0) {
      return 'text-red-600 font-semibold'; // Expiré
    } else if (daysRemaining <= 1) {
      return 'text-red-500 font-medium animate-pulse'; // Critique (1 jour ou moins)
    } else if (daysRemaining <= 3) {
      return 'text-orange-500 font-medium'; // Attention (2-3 jours)
    } else if (daysRemaining <= 7) {
      return 'text-yellow-600'; // Bientôt (4-7 jours)
    } else {
      return 'text-green-600'; // OK (plus de 7 jours)
    }
  };

  // Fonction pour formater l'affichage de l'échéance
  const formatDeadlineDisplay = (deadline: string | Date, status: string) => {
    if (!deadline) return '-';
    if (['REPLIED', 'CLOTURER'].includes(status)) return '✓';
    
    const daysRemaining = getDaysUntilDeadline(deadline);
    if (daysRemaining === null) return '-';
    
    if (daysRemaining < 0) {
      return `${Math.abs(daysRemaining)}j retard`;
    } else if (daysRemaining === 0) {
      return 'Aujourd\'hui';
    } else if (daysRemaining === 1) {
      return 'Demain';
    } else {
      return `${daysRemaining} jours`;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
            Liste des Correspondances
            {correspondances.filter(isUnresponded).length > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800 animate-bounce">
                <AlertCircle className="w-3 h-3 mr-1" />
                {correspondances.filter(isUnresponded).length} non répondue(s)
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Gérer toutes les correspondances officielles. Les correspondances non répondues clignotent en rouge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="correspondances-table-container hide-scrollbar">
            <Table className="correspondances-table">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-aviation-sky/10 to-blue-50">
                  <TableHead className="w-[15%] font-semibold text-xs">Objet</TableHead>
                  <TableHead className="w-[12%] font-semibold text-xs">Contenu</TableHead>
                  <TableHead className="w-[8%] font-semibold text-xs">Expéditeur</TableHead>
                  <TableHead className="w-[8%] font-semibold text-xs">Destinataire</TableHead>
                  <TableHead className="w-[5%] font-semibold text-xs">Type</TableHead>
                  <TableHead className="w-[7%] font-semibold text-xs">Priorité</TableHead>
                  <TableHead className="w-[7%] font-semibold text-xs">Statut</TableHead>
                  <TableHead className="w-[8%] font-semibold text-xs">Départements Resp.</TableHead>
                  <TableHead className="w-[6%] font-semibold text-xs">Date Corresp.</TableHead>
                  <TableHead className="w-[6%] font-semibold text-xs">Échéance</TableHead>
                  <TableHead className="w-[8%] font-semibold text-xs">Tags</TableHead>
                  <TableHead className="w-[6%] font-semibold text-xs">Liaison</TableHead>
                  <TableHead className="w-[8%] font-semibold text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((correspondance) => (
                  <TableRow 
                    key={correspondance._id || correspondance.id} 
                    className={getRowClasses(correspondance)}
                    onClick={() => setSelectedCorrespondance(correspondance)}
                  >
                    <TableCell className="font-medium w-[15%]">
                      <div className="flex items-center">
                        {isUnresponded(correspondance) && (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2 animate-pulse flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-gray-900 truncate text-sm">{correspondance.subject}</div>
                          {correspondance.code && (
                            <span className="font-mono text-xs bg-aviation-sky/10 text-aviation-sky px-1 py-0.5 rounded mt-1 inline-block">
                              {correspondance.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 w-[12%]">
                      <div className="truncate">
                        {truncateText(correspondance.content, 40)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 w-[8%]">
                      <div className="truncate" title={correspondance.from_address}>
                        {correspondance.from_address}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 w-[8%]">
                      <div className="truncate" title={correspondance.to_address}>
                        {correspondance.to_address}
                      </div>
                    </TableCell>
                    <TableCell className="w-[5%]">
                      <div className="flex items-center justify-center">
                        {getTypeIcon(correspondance.type)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[7%]">
                      <Badge className={`text-xs ${getPriorityColor(correspondance.priority)}`}>
                        {correspondance.priority === 'URGENT' ? 'URG' : 
                         correspondance.priority === 'HIGH' ? 'HAU' :
                         correspondance.priority === 'MEDIUM' ? 'MOY' : 'BAS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[7%]">
                      <div className="flex items-center">
                        <Badge className={`text-xs ${getStatusColor(correspondance.status)}`}>
                          {correspondance.status === 'PENDING' ? 'ATT' :
                           correspondance.status === 'REPLIED' ? 'REP' : 'INF'}
                        </Badge>
                        {isUnresponded(correspondance) && (
                          <AlertCircle className="w-3 h-3 text-red-500 ml-1 animate-pulse" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 w-[8%]">
                      <div className="truncate">
                        {correspondance.department_code || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 w-[6%]">
                      <div className="truncate">
                        {formatDate(correspondance.date_correspondance || correspondance.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 w-[6%]">
                      <div className="truncate">
                        <span className={getDeadlineColor(correspondance.deadline, correspondance.status)}>
                          {formatDeadlineDisplay(correspondance.deadline, correspondance.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <div className="flex flex-wrap gap-1">
                        {correspondance.tags && correspondance.tags.length > 0 ? (
                          <>
                            {correspondance.tags.slice(0, 2).map((tagName: string, index: number) => {
                              const tagColors = getTagColor(tagName);
                              const tag = tags?.find(t => t.name === tagName);
                              return (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  style={tagColors}
                                  className="text-xs px-2 py-1 rounded border transition-colors cursor-pointer hover:opacity-80 flex items-center gap-1"
                                  title={tag?.description || tagName}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTagFilter(tagName);
                                  }}
                                >
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: tag?.color || tagColors.color }}
                                  />
                                  <span className="truncate max-w-[50px]">
                                    {tagName.length > 6 ? tagName.substring(0, 6) + '...' : tagName}
                                  </span>
                                </Badge>
                              );
                            })}
                            {correspondance.tags.length > 2 && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200"
                                title={`${correspondance.tags.length - 2} tags supplémentaires: ${correspondance.tags.slice(2).join(', ')}`}
                              >
                                +{correspondance.tags.length - 2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Aucun tag</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Liaison */}
                    <TableCell className="w-[6%]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <CorrespondanceLinkButton 
                          correspondance={correspondance}
                          onNavigate={(targetId) => {
                            // Trouver la correspondance cible et l'ouvrir
                            const targetCorrespondance = correspondances.find(c => c._id === targetId || c.id === targetId);
                            if (targetCorrespondance) {
                              setSelectedCorrespondance(targetCorrespondance);
                            }
                          }}
                        />
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="w-[8%]">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditButtonClick(correspondance);
                          }}
                          className="hover:bg-blue-50 hover:border-blue-300 p-2"
                          title="Modifier la correspondance"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(correspondance._id || correspondance.id, correspondance.subject);
                          }}
                          className="hover:bg-red-50 hover:border-red-300 p-2"
                          title="Supprimer la correspondance"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                        {correspondance.filePath || correspondance.file_path ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const filePath = correspondance.filePath || correspondance.file_path;
                                if (filePath) {
                                  const link = document.createElement('a');
                                  link.href = getAbsoluteFilePath(filePath);
                                  link.download = `correspondance-${correspondance.code || correspondance.subject?.substring(0, 20) || 'document'}.${correspondance.file_type?.split('/')[1] || 'pdf'}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                              className="hover:bg-green-50 hover:border-green-300 p-2"
                              title="Télécharger l'attachement"
                            >
                              <FileDown className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const filePath = correspondance.filePath || correspondance.file_path;
                                if (filePath) {
                                  window.open(getAbsoluteFilePath(filePath), '_blank');
                                }
                              }}
                              className="hover:bg-blue-50 hover:border-blue-300 p-2"
                              title="Visualiser le fichier attaché"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCorrespondance(correspondance);
                            }}
                            className="hover:bg-gray-50 hover:border-gray-300 p-2"
                            title="Voir les détails"
                          >
                            <Info className="w-4 h-4 text-gray-600" />
                          </Button>
                        )}
                        <EnhancedCreateWorkflowDialog
                          correspondenceId={correspondance._id || correspondance.id}
                          correspondenceSubject={correspondance.subject}
                          onWorkflowCreated={(workflowId) => {
                            window.open(`/enhanced-workflow/${workflowId}`, '_blank');
                          }}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-purple-50 hover:border-purple-300 p-2"
                              title="Créer un workflow de traitement complet"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Workflow className="w-4 h-4 text-purple-600" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="text-sm text-gray-600 font-medium">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, correspondances.length)} sur {correspondances.length} correspondances
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="hover:bg-aviation-sky/10"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-aviation-sky text-white" : "hover:bg-aviation-sky/10"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="hover:bg-aviation-sky/10"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!correspondanceToDelete} onOpenChange={(open) => !open && setCorrespondanceToDelete('')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la correspondance "{correspondanceToDeleteSubject}" et toutes les données associées de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <CorrespondanceDetailDialog 
        correspondance={selectedCorrespondance} 
        isOpen={!!selectedCorrespondance} 
        onClose={() => setSelectedCorrespondance(null)}
        onCorrespondanceSelect={(correspondance) => setSelectedCorrespondance(correspondance)}
      />

      {/* Dialog pour le suivi des correspondances INFORMATIF */}
      {selectedInformatifCorrespondance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Suivi Correspondance Informative</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInformatifCorrespondance(null)}
              >
                ×
              </Button>
            </div>
            <InformatifCorrespondanceTracker 
              correspondance={selectedInformatifCorrespondance}
            />
          </div>
        </div>
      )}

      {/* Dialog pour créer un draft de réponse */}
      {correspondanceForDraft && (
        <ResponseDraftDialog
          isOpen={draftDialogOpen}
          onClose={() => {
            setDraftDialogOpen(false);
            setCorrespondanceForDraft(null);
          }}
          correspondance={correspondanceForDraft}
          onDraftSubmitted={handleDraftSubmitted}
        />
      )}
    </>
  );
};