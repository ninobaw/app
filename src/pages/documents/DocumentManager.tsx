import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeft, FileText, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
type DocumentType = 'FORMULAIRE_DOC' | 'QUALITE_DOC' | 'NOUVEAU_DOC' | 'GENERAL' | 'TEMPLATE' | 'CORRESPONDANCE' | 'PROCES_VERBAL';
type DocumentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
type Airport = 'ENFIDHA' | 'MONASTIR' | 'GENERALE';

interface DocumentData {
  _id: string;
  id?: string;
  title: string;
  type: DocumentType;
  content: string;
  status: DocumentStatus;
  airport: Airport;
  metadata: {
    reference?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    tags?: string[];
    lastRevisionDate?: string;
    revisionNumber?: number;
    revisionComment?: string;
  };
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentVersion?: number;
  createdAt: string;
  updatedAt: string;
}

// Composant principal
export const DocumentManager: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // État du formulaire
  const [formData, setFormData] = useState<Omit<DocumentData, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'author' | 'updatedBy' | 'currentVersion'>>({
    title: '',
    type: 'GENERAL',
    content: '',
    status: 'DRAFT',
    airport: 'ENFIDHA',
    metadata: {}
  });

  // Récupérer le document existant
  const { data: document, isLoading } = useQuery<DocumentData>({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement du document');
      const result = await response.json();
      // Extraire les données du format de réponse de l'API
      return result.success ? result.data : null;
    },
    enabled: !isNew
  });

  // Récupérer la liste des documents
  const { data: documents = [], isLoading: isLoadingList } = useQuery<DocumentData[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Documents API: Token from localStorage:', token ? 'Present' : 'Missing');
      console.log('Documents API: Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'None');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      console.log('Documents API: Headers being sent:', headers);
      
      const response = await fetch('http://localhost:5000/api/documents', {
        headers
      });
      
      console.log('Documents API: Response status:', response.status);
      console.log('Documents API: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Documents API: Error response:', errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Documents API response:', result);
      // Extraire les données du format de réponse de l'API
      return result.success ? result.data : (Array.isArray(result) ? result : []);
    }
  });

  // Mettre à jour le formulaire quand le document est chargé
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        type: document.type,
        content: document.content,
        status: document.status,
        airport: document.airport,
        metadata: document.metadata || {}
      });
    } else if (isNew) {
      // Réinitialiser le formulaire pour un nouveau document
      setFormData({
        title: '',
        type: 'GENERAL',
        content: '',
        status: 'DRAFT',
        airport: 'ENFIDHA',
        metadata: {}
      });
    }
  }, [document, isNew]);

  // Mutation pour créer/mettre à jour un document
  const saveMutation = useMutation({
    mutationFn: async (data: Omit<DocumentData, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'author' | 'updatedBy' | 'currentVersion'>) => {
      const url = isNew ? 'http://localhost:5000/api/documents' : `http://localhost:5000/api/documents/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          author: user?.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      return result.success ? result.data : result;
    },
    onSuccess: (savedDocument) => {
      toast({
        title: 'Succès',
        description: isNew ? 'Document créé avec succès' : 'Document mis à jour avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (isNew) {
        navigate(`/documents/${savedDocument.id}/edit`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  // Filtrer les documents selon le terme de recherche
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.metadata?.tags?.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading || (isNew === false && !document)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Afficher la liste des documents si aucun ID n'est spécifié
  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Documents</h1>
          <Button onClick={() => navigate('/documents/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau document
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des documents..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Aéroport</TableHead>
                <TableHead>Dernière modification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <TableRow 
                    key={doc._id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => navigate(`/documents/${doc._id}/edit`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell>{getAirportLabel(doc.airport)}</TableCell>
                    <TableCell>
                      {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/documents/${doc._id}/edit`);
                        }}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {isLoadingList ? 'Chargement...' : 'Aucun document trouvé'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Afficher le formulaire de création/édition
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        
        <h1 className="text-2xl font-bold">
          {isNew ? 'Nouveau document' : 'Modifier le document'}
        </h1>
        
        <Button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de document *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: DocumentType) => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FORMULAIRE_DOC">Formulaire</SelectItem>
                <SelectItem value="QUALITE_DOC">Document qualité</SelectItem>
                <SelectItem value="NOUVEAU_DOC">Nouveau document</SelectItem>
                <SelectItem value="GENERAL">Général</SelectItem>
                <SelectItem value="TEMPLATE">Modèle</SelectItem>
                <SelectItem value="CORRESPONDANCE">Correspondance</SelectItem>
                <SelectItem value="PROCES_VERBAL">Procès-verbal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: DocumentStatus) => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PENDING_REVIEW">En attente de relecture</SelectItem>
                <SelectItem value="APPROVED">Approuvé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
                <SelectItem value="ARCHIVED">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="airport">Aéroport *</Label>
            <Select
              value={formData.airport}
              onValueChange={(value: Airport) => 
                setFormData({ ...formData, airport: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un aéroport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                <SelectItem value="MONASTIR">Monastir</SelectItem>
                <SelectItem value="GENERALE">Générale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.metadata?.reference || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, reference: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              value={formData.metadata?.priority || ''}
              onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setFormData({
                ...formData,
                metadata: { 
                  ...formData.metadata, 
                  priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' 
                }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Basse</SelectItem>
                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                <SelectItem value="HIGH">Haute</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Tags (séparés par des virgules)</Label>
            <Input
              value={formData.metadata?.tags?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { 
                  ...formData.metadata, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }
              })}
              placeholder="Ex: qualité, procédure, sécurité"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contenu du document</Label>
          <Textarea
            value={formData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[300px]"
            placeholder="Saisissez le contenu de votre document ici..."
          />
        </div>
      </form>
    </div>
  );
};

// Composants d'aide
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap = {
    DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
    PENDING_REVIEW: { label: 'En relecture', className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Approuvé', className: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
    ARCHIVED: { label: 'Archivé', className: 'bg-gray-200 text-gray-600' }
  };

  const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
};

const getDocumentTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    FORMULAIRE_DOC: 'Formulaire',
    QUALITE_DOC: 'Qualité',
    NOUVEAU_DOC: 'Nouveau',
    GENERAL: 'Général',
    TEMPLATE: 'Modèle',
    CORRESPONDANCE: 'Correspondance',
    PROCES_VERBAL: 'Procès-verbal'
  };
  return typeMap[type] || type;
};

const getAirportLabel = (airport: string) => {
  const airportMap: Record<string, string> = {
    ENFIDHA: 'Enfidha',
    MONASTIR: 'Monastir',
    GENERALE: 'Générale'
  };
  return airportMap[airport] || airport;
};

export default DocumentManager;
