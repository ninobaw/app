import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, Info, X } from 'lucide-react';
import { CorrespondancesList } from '@/components/correspondances/CorrespondancesList';
import { CreateCorrespondanceDialog } from '@/components/correspondances/CreateCorrespondanceDialog';
import { CorrespondanceEditDialog } from '@/components/correspondances/CorrespondanceEditDialog';
import { ImportCorrespondancesExcelDialog } from '@/components/correspondances/ImportCorrespondancesExcelDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCorrespondances, type CorrespondanceData } from '@/hooks/useCorrespondances';
import { useTags } from '@/hooks/useTags';
import { toast } from '@/hooks/use-toast';

const Correspondances = () => {
  const { correspondances = [], isLoading } = useCorrespondances();
  const { user } = useAuth();
  const { data: predefinedTags } = useTags();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'INCOMING' | 'OUTGOING'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all'); // Nouveau filtre département
  const [filterTags, setFilterTags] = useState<string[]>([]); // New state for tag filter
  const [showDashboardAlert, setShowDashboardAlert] = useState(false);
  
  // États pour le dialog d'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCorrespondance, setSelectedCorrespondance] = useState<CorrespondanceData | null>(null);

  // Fonction pour gérer la sauvegarde d'une correspondance modifiée
  const handleSaveCorrespondance = async (updatedCorrespondance: CorrespondanceData) => {
    try {
      // La mise à jour est déjà faite dans le composant CorrespondanceEditDialog
      // On ferme juste le dialogue et on rafraîchit les données
      
      // Afficher un message de succès
      toast({
        title: "Succès",
        description: "La correspondance a été mise à jour avec succès.",
      });
      
      // Fermer le dialogue d'édition
      setEditDialogOpen(false);
      
      // Rafraîchir les données pour voir les modifications
      refetch();
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la correspondance :', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la correspondance.",
        variant: "destructive",
      });
    }
  };

  // Extraire tous les départements uniques des correspondances
  const allDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    correspondances.forEach(corr => {
      if (corr.department_code) {
        deptSet.add(corr.department_code);
      }
    });
    return Array.from(deptSet).sort();
  }, [correspondances]);

  // Filtrer les correspondances d'abord
  const filteredCorrespondances = useMemo(() => {
    return correspondances.filter((corr: any) => {
      const matchesSearch = searchTerm === '' || 
        corr.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corr.from_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corr.to_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corr.code?.toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ AJOUT: Recherche par code
        corr.title?.toLowerCase().includes(searchTerm.toLowerCase()); // ✅ AJOUT: Recherche par titre
      
      const matchesPriority = filterPriority === 'all' || corr.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || corr.status === filterStatus;
      
      // Utiliser directement la propriété type si elle existe
      let matchesType = true;
      if (filterType !== 'all') {
        if (corr.type) {
          // Si la propriété type existe, l'utiliser directement
          matchesType = corr.type === filterType;
        } else {
          // Sinon, utiliser la logique basée sur les adresses comme fallback
          const isFromInternal = corr.from_address?.toLowerCase().includes('enfidha') || 
                                corr.from_address?.toLowerCase().includes('monastir') ||
                                corr.from_address?.toLowerCase().includes('tav');
          const isToInternal = corr.to_address?.toLowerCase().includes('enfidha') || 
                              corr.to_address?.toLowerCase().includes('monastir') ||
                              corr.to_address?.toLowerCase().includes('tav');
          
          if (filterType === 'INCOMING') {
            matchesType = !isFromInternal && isToInternal;
          } else if (filterType === 'OUTGOING') {
            matchesType = isFromInternal && !isToInternal;
          }
        }
      }
      
      const matchesDepartment = filterDepartment === 'all' || corr.department_code === filterDepartment;
      const matchesTags = filterTags.length === 0 || filterTags.some(tag => corr.tags?.includes(tag) || false);
      
      return matchesSearch && matchesPriority && matchesStatus && matchesType && matchesDepartment && matchesTags;
    });
  }, [correspondances, searchTerm, filterPriority, filterStatus, filterType, filterDepartment, filterTags]);

  // Extraire les tags qui existent réellement dans les correspondances
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    correspondances.forEach(corr => {
      if (corr.tags && Array.isArray(corr.tags)) {
        corr.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [correspondances]);

  // Fonction pour obtenir les informations d'un tag prédéfini (pour les couleurs)
  const getTagInfo = (tagName: string) => {
    return predefinedTags?.find(tag => tag.name === tagName);
  };

  // Fonction pour ajouter/supprimer un tag du filtre
  const toggleTag = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Effet pour lire les paramètres depuis l'URL
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    const priorityFromUrl = searchParams.get('priority');
    const typeFromUrl = searchParams.get('type');
    
    if (statusFromUrl) {
      setFilterStatus(statusFromUrl);
      setShowDashboardAlert(true);
    }
    
    if (priorityFromUrl) {
      setFilterPriority(priorityFromUrl);
      setShowDashboardAlert(true);
    }
    
    if (typeFromUrl && (typeFromUrl === 'INCOMING' || typeFromUrl === 'OUTGOING')) {
      setFilterType(typeFromUrl as 'INCOMING' | 'OUTGOING');
      setShowDashboardAlert(true);
    }
  }, [searchParams]);

  // Gérer l'ouverture automatique via URL
  useEffect(() => {
    const correspondanceId = params.id;
    if (correspondanceId && correspondances.length > 0) {
      const correspondance = correspondances.find(c => c._id === correspondanceId);
      if (correspondance) {
        setSelectedCorrespondance(correspondance);
        setEditDialogOpen(true);
      }
    }
  }, [params.id, correspondances]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterType('all');
    setFilterDepartment('all'); // Réinitialiser le filtre département
    setFilterTags([]);
    setShowDashboardAlert(false);
    // Supprimer tous les paramètres de l'URL
    setSearchParams(prev => {
      prev.delete('status');
      prev.delete('priority');
      prev.delete('type');
      return prev;
    });
  };

  // Mapping des statuts et types pour l'affichage
  const statusLabels = {
    'PENDING': 'En Attente',
    'REPLIED': 'Répondu', 
    'INFORMATIF': 'Informatif',
    'DRAFT': 'Brouillon'
  };

  const typeLabels = {
    'INCOMING': 'Entrante',
    'OUTGOING': 'Sortante'
  };

  const priorityLabels = {
    'URGENT': 'Urgent',
    'HIGH': 'Élevée',
    'MEDIUM': 'Moyenne',
    'LOW': 'Faible'
  };

  const getTagColorClass = (index: number) => {
    const colors = [
      { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500', hoverBg: 'hover:bg-blue-100' },
      { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500', hoverBg: 'hover:bg-green-100' },
      { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-500', hoverBg: 'hover:bg-purple-100' },
      { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', hoverBg: 'hover:bg-orange-100' },
      { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-500', hoverBg: 'hover:bg-red-100' },
      { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-500', hoverBg: 'hover:bg-indigo-100' },
      { bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-500', hoverBg: 'hover:bg-pink-100' },
      { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500', hoverBg: 'hover:bg-yellow-100' },
    ];

    return colors[index % colors.length];
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Correspondances</h1>
            {filterStatus !== 'all' && (
              <p className="text-sm text-gray-600 mt-1">
                Filtré par statut : <span className="font-medium text-blue-600">
                  {statusLabels[filterStatus as keyof typeof statusLabels] || filterStatus}
                </span>
              </p>
            )}
            {filterPriority !== 'all' && (
              <p className="text-sm text-gray-600 mt-1">
                Filtré par priorité : <span className="font-medium text-blue-600">
                  {priorityLabels[filterPriority as keyof typeof priorityLabels] || filterPriority}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {/* Bouton de création - visible pour agents, superviseurs de bureau d'ordre et super admin */}
            {(user?.role === 'AGENT_BUREAU_ORDRE' || user?.role === 'SUPERVISEUR_BUREAU_ORDRE' || user?.role === 'SUPER_ADMIN') && (
              <CreateCorrespondanceDialog />
            )}
            
            {/* Bouton d'import - visible uniquement pour super admin */}
            {user?.role === 'SUPER_ADMIN' && (
              <ImportCorrespondancesExcelDialog />
            )}
          </div>
        </div>

        {/* Alerte de navigation depuis le dashboard */}
        {showDashboardAlert && (filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all' || filterDepartment !== 'all' || filterTags.length > 0) && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-blue-800">
                Vous avez été redirigé depuis le dashboard. Affichage des correspondances 
                {filterStatus !== 'all' && ` avec le statut "${statusLabels[filterStatus as keyof typeof statusLabels] || filterStatus}"`}
                {filterPriority !== 'all' && ` avec la priorité "${priorityLabels[filterPriority as keyof typeof priorityLabels] || filterPriority}"`}
                {filterType !== 'all' && ` de type "${typeLabels[filterType as keyof typeof typeLabels] || filterType}"`}
                {filterDepartment !== 'all' && ` du département "${filterDepartment}"`}
                {filterTags.length > 0 && ` avec les tags "${filterTags.join(', ')}"`}.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDashboardAlert(false)}
                className="text-blue-600 hover:text-blue-800 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtres et Recherche
              {(searchTerm || filterPriority !== 'all' || filterStatus !== 'all' || filterType !== 'all' || filterTags.length > 0) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  className="ml-auto"
                >
                  Réinitialiser
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par sujet, expéditeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par priorité */}
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre par statut */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En Attente</SelectItem>
                  <SelectItem value="REPLIED">Répondu</SelectItem>
                  <SelectItem value="INFORMATIF">Informatif</SelectItem>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre par type */}
              <Select value={filterType} onValueChange={(value: 'all' | 'INCOMING' | 'OUTGOING') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="INCOMING">Entrante</SelectItem>
                  <SelectItem value="OUTGOING">Sortante</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre par département */}
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {allDepartments.map(department => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Information sur les tags */}
              <div className="md:col-span-2 lg:col-span-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Filtrage par tags :</strong> Utilisez le nuage de tags ci-dessous pour filtrer les correspondances. 
                    Seuls les tags qui existent dans vos correspondances sont affichés.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section des tags disponibles - Optimisée sans défilement */}
        {availableTags.length > 0 && (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 rounded-xl border border-slate-200 shadow-sm">
              {/* Header informatif */}
              <div className="flex items-center justify-between p-3 border-b border-slate-200/50">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Tags disponibles ({availableTags.length})
                  </h3>
                  {filterTags.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {filterTags.length} sélectionné{filterTags.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {filterTags.length > 0 && (
                  <button
                    onClick={() => setFilterTags([])}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Effacer
                  </button>
                )}
              </div>

              {/* Conteneur de tags optimisé sans défilement */}
              <div className="relative p-3">
                <div className="flex flex-wrap items-center justify-start gap-2">
                  {availableTags.map((tag, index) => {
                    const isSelected = filterTags.includes(tag);
                    const count = correspondances.filter(c => c.tags?.includes(tag)).length;
                    const tagInfo = getTagInfo(tag);
                    
                    // Calcul de la taille basée sur le nombre d'occurrences
                    const getTagSize = (count: number) => {
                      if (count >= 10) return 'text-sm px-3 py-1';
                      if (count >= 5) return 'text-sm px-2.5 py-1';
                      return 'text-xs px-2 py-0.5';
                    };
                    
                    // Style du tag
                    const getTagStyle = (tagInfo: any, isSelected: boolean) => {
                      if (isSelected) {
                        return 'ring-2 ring-offset-1 shadow-md transform scale-105';
                      }
                      return 'hover:shadow-md hover:scale-105';
                    };
                    
                    // Animation au survol
                    const getHoverAnimation = () => {
                      const animations = [
                        'hover:-translate-y-0.5',
                        'hover:rotate-1',
                        'hover:-rotate-1',
                        'hover:translate-y-0.5'
                      ];
                      return animations[index % animations.length];
                    };
                    
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`
                          relative rounded-full transition-all duration-200 
                          flex items-center space-x-1.5 m-0.5
                          ${getTagSize(count)}
                          ${getTagStyle(tagInfo, isSelected)}
                          ${getHoverAnimation()}
                          ${isSelected ? 'z-10' : ''}
                        `}
                        style={{ 
                          backgroundColor: tagInfo?.color || '#6B7280',
                          color: 'white',
                        }}
                        title={`${tag} (${count} correspondance${count > 1 ? 's' : ''})`}
                      >
                        {isSelected && (
                          <span className="animate-pulse">•</span>
                        )}
                        <span className="font-medium truncate max-w-[100px] sm:max-w-[150px]">
                          {tag}
                        </span>
                        <span className={`
                          px-1 py-0.5 rounded-full text-[10px] font-bold min-w-[16px] text-center
                          ${isSelected 
                            ? 'bg-yellow-400 text-yellow-900' 
                            : 'bg-white/30 text-white'
                          }
                        `}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des correspondances - Affichage principal */}
        <div className="mt-4">
          <CorrespondancesList 
            correspondances={filteredCorrespondances} 
            isLoading={isLoading}
            onTagFilter={toggleTag}
            onEdit={(correspondance) => {
              setSelectedCorrespondance(correspondance);
              setEditDialogOpen(true);
            }}
          />
        </div>
        
        {/* Dialog d'édition */}
        <CorrespondanceEditDialog 
          isOpen={editDialogOpen} 
          correspondance={selectedCorrespondance} 
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveCorrespondance}
        />
      </div>
    </AppLayout>
  );
};

export default Correspondances;