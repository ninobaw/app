import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Reply, Search, Calendar, User, Building, AlertCircle } from 'lucide-react';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { CreateCorrespondanceDialog } from './CreateCorrespondanceDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PendingCorrespondanceSelectorProps {
  onCorrespondanceSelected?: (correspondance: any) => void;
}

export const PendingCorrespondanceSelector = ({ onCorrespondanceSelected }: PendingCorrespondanceSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAirport, setFilterAirport] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [selectedCorrespondance, setSelectedCorrespondance] = useState<any>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  const { correspondances, isLoading } = useCorrespondances();


  const handleReplyToCorrespondance = (correspondance: any) => {
    setSelectedCorrespondance(correspondance);
    setIsOpen(false);
    // Délai pour permettre à la première dialog de se fermer avant d'ouvrir la seconde
    setTimeout(() => {
      setShowReplyDialog(true);
    }, 100);
    if (onCorrespondanceSelected) {
      onCorrespondanceSelected(correspondance);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAirportColor = (airport: string) => {
    switch (airport) {
      case 'ENFIDHA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MONASTIR': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCorrespondances = correspondances?.filter((corr: any) => {
    
    // Exclure les réponses et ne garder que les correspondances en attente
    if (corr.parentCorrespondanceId) {
      return false;
    }
    
    // Accepter PENDING, REPLIED ou si pas de statut défini (pour permettre les réponses aux correspondances répondues)
    if (corr.status && !['PENDING', 'REPLIED'].includes(corr.status)) {
      return false;
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        corr.subject?.toLowerCase().includes(searchLower) ||
        corr.from_address?.toLowerCase().includes(searchLower) ||
        corr.to_address?.toLowerCase().includes(searchLower) ||
        corr.content?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Filtrer par aéroport
    if (filterAirport && filterAirport !== 'ALL' && corr.airport !== filterAirport) return false;
    
    // Filtrer par priorité
    if (filterPriority && filterPriority !== 'ALL' && corr.priority !== filterPriority) return false;
    
    return true;
  }) || [];


  return (
    <>
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Reply className="h-4 w-4" />
        Répondre à une correspondance
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Sélectionner une correspondance à laquelle répondre
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {filteredCorrespondances.length} correspondance(s) disponible(s) pour réponse
            </p>
          </DialogHeader>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par sujet, expéditeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAirport} onValueChange={setFilterAirport}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par aéroport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les aéroports</SelectItem>
                <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                <SelectItem value="MONASTIR">Monastir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les priorités</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">Élevée</SelectItem>
                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                <SelectItem value="LOW">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Liste des correspondances */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des correspondances...</p>
              </div>
            ) : filteredCorrespondances.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune correspondance en attente trouvée</p>
                <p className="text-xs text-gray-500 mt-2">
                  Total correspondances: {correspondances?.length || 0}
                </p>
              </div>
            ) : (
              filteredCorrespondances.map((correspondance: any) => (
                <Card key={correspondance._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{correspondance.subject || 'Sujet non spécifié'}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getPriorityColor(correspondance.priority)}>
                            {correspondance.priority || 'MEDIUM'}
                          </Badge>
                          <Badge className={getAirportColor(correspondance.airport)}>
                            {correspondance.airport || 'N/A'}
                          </Badge>
                          <Badge variant="outline">
                            {correspondance.type || 'INCOMING'}
                          </Badge>
                          <Badge variant="secondary">
                            {correspondance.status || 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleReplyToCorrespondance(correspondance)}
                        size="sm"
                        className="ml-4"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Répondre
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">De:</span>
                        <span className="truncate">{correspondance.from_address || 'Non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Date:</span>
                        <span>
                          {correspondance.createdAt || correspondance.created_at ? 
                            format(new Date(correspondance.createdAt || correspondance.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr }) :
                            'Date non disponible'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">À:</span>
                        <span className="truncate">{correspondance.to_address || 'Non spécifié'}</span>
                      </div>
                      {correspondance.responseDeadline && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-400" />
                          <span className="font-medium">Échéance:</span>
                          <span className="text-orange-600">
                            {format(new Date(correspondance.responseDeadline), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                    {correspondance.content && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-600 mb-1">Contenu:</p>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {correspondance.content}
                        </p>
                      </div>
                    )}
                    {correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-600">Personnes concernées: </span>
                        <span className="text-sm text-gray-700">
                          {correspondance.personnesConcernees.map((p: any) => 
                            `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`
                          ).join(', ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de réponse */}
      {showReplyDialog && selectedCorrespondance && (
        <CreateCorrespondanceDialog
          parentCorrespondance={{
            _id: selectedCorrespondance._id,
            subject: selectedCorrespondance.subject,
            from_address: selectedCorrespondance.from_address
          }}
          isOpen={showReplyDialog}
          onOpenChange={(open) => {
            setShowReplyDialog(open);
            if (!open) {
              setSelectedCorrespondance(null);
            }
          }}
        />
      )}
    </>
  );
};
