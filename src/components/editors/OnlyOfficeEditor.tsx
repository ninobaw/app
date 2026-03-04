import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Send, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  History,
  Users,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: any) => any;
    };
  }
}

interface OnlyOfficeEditorProps {
  documentId: string;
  onSave?: (document: any) => void;
  onStatusChange?: (status: string) => void;
  showHeader?: boolean;
}

export function OnlyOfficeEditor({ 
  documentId, 
  onSave, 
  onStatusChange,
  showHeader = true 
}: OnlyOfficeEditorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documentData, setDocumentData] = useState({
    title: '',
    status: 'DRAFT',
    lastModified: new Date(),
    version: '1.0.0',
    collaborators: [] as { id: string; name: string; role: string }[],
    permissions: {
      canEdit: true,
      canDownload: true,
      canPrint: true,
    },
  });

  // Charger les données du document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        // Obtenir le token JWT depuis localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token d\'authentification manquant');
        }

        const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Document non trouvé');
        
        const result = await response.json();
        const data = result.data || result;
        setDocumentData({
          title: data.title || data.name,
          status: data.status,
          lastModified: new Date(data.updatedAt),
          version: data.currentVersion || data.version || '1.0.0',
          collaborators: data.collaborators || [],
          permissions: data.permissions || {
            canEdit: true,
            canDownload: true,
            canPrint: true,
          },
        });
        
        initializeEditor(data);
      } catch (error) {
        console.error('Erreur lors du chargement du document:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le document. Veuillez réessayer.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchDocument();

    // Nettoyer l'éditeur lors du démontage
    return () => {
      if (editorRef.current) {
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }
    };
  }, [documentId]);

  // Initialiser l'éditeur OnlyOffice
  const initializeEditor = async (documentData: any) => {
    if (!window.DocsAPI) {
      console.error('OnlyOffice DocsAPI non chargée');
      setIsLoading(false);
      return;
    }

    try {
      // Obtenir le token JWT
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Récupérer la configuration de l'éditeur depuis le serveur
      const response = await fetch('http://localhost:5000/api/onlyoffice/editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId,
          fileName: documentData.title || documentData.name,
          userId: user?.id,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur',
          userEmail: user?.email,
          permissions: documentData.permissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la configuration de l\'éditeur');
      }

      const config = await response.json();

      // Initialiser l'éditeur
      editorRef.current = new window.DocsAPI.DocEditor('onlyoffice-editor', {
        ...config,
        events: {
          onAppReady: () => {
            console.log('OnlyOffice Editor est prêt');
            setIsLoading(false);
          },
          onDocumentStateChange: (event: any) => {
            console.log('Changement d\'état du document:', event);
            // Mettre à jour l'état si nécessaire
          },
          onError: (event: any) => {
            console.error('Erreur OnlyOffice:', event);
            toast({
              title: 'Erreur de l\'éditeur',
              description: 'Une erreur est survenue dans l\'éditeur de document.',
              variant: 'destructive',
            });
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'éditeur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'éditeur de document.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Gérer la sauvegarde du document
  const handleSave = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    
    try {
      // Demander à OnlyOffice de sauvegarder le document
      editorRef.current.downloadAs({
        // Les paramètres de sauvegarde seront gérés par le callback du serveur
      });
      
      // Obtenir le token JWT
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Mettre à jour les métadonnées du document
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          versionComment: 'Sauvegarde automatique depuis OnlyOffice'
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour des métadonnées');
      
      const updatedDoc = await response.json();
      
      setDocumentData(prev => ({
        ...prev,
        lastModified: new Date(updatedDoc.updatedAt),
        version: updatedDoc.version,
      }));
      
      toast({
        title: 'Document sauvegardé',
        description: 'Vos modifications ont été enregistrées avec succès.',
      });
      
      if (onSave) onSave(updatedDoc);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde du document.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cette fonction a été supprimée car elle n'est plus utilisée
  // Le versioning est maintenant géré côté serveur

  // Changer le statut du document
  const updateDocumentStatus = async (newStatus: string) => {
    try {
      // Obtenir le token JWT
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          versionComment: `Changement de statut vers ${newStatus}`
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      
      const result = await response.json();
      const data = result.data || result;
      
      setDocumentData(prev => ({
        ...prev,
        status: newStatus,
        lastModified: new Date(),
      }));
      
      toast({
        title: 'Statut mis à jour',
        description: `Le document est maintenant marqué comme "${getStatusLabel(newStatus)}".`,
      });
      
      if (onStatusChange) onStatusChange(newStatus);
      
      return data;
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du document.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      DRAFT: 'Brouillon',
      IN_REVIEW: 'En révision',
      APPROVED: 'Approuvé',
      PUBLISHED: 'Publié',
      ARCHIVED: 'Archivé',
    };
    return statusLabels[status] || status;
  };

  // Obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-purple-100 text-purple-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Rendu du composant
  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Retour</span>
            </Button>
            
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {documentData.title || 'Document sans titre'}
              </h1>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>Dernière modification: {format(documentData.lastModified, 'PPPp', { locale: fr })}</span>
                <span>•</span>
                <span>Version: {documentData.version}</span>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${getStatusColor(documentData.status)}`}
                >
                  {getStatusLabel(documentData.status)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Users className="h-4 w-4" />
                    <span>{documentData.collaborators.length}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Collaborateurs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <History className="h-4 w-4" />
                    <span>Historique</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir l'historique des modifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {documentData.status === 'DRAFT' && (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1"
                onClick={() => updateDocumentStatus('IN_REVIEW')}
                disabled={isSaving}
              >
                <Send className="h-4 w-4" />
                <span>Soumettre pour validation</span>
              </Button>
            )}
            
            {documentData.status === 'IN_REVIEW' && user?.role === 'APPROVER' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => updateDocumentStatus('DRAFT')}
                  disabled={isSaving}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Refuser</span>
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateDocumentStatus('APPROVED')}
                  disabled={isSaving}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approuver</span>
                </Button>
              </div>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1"
              onClick={handleSave}
              disabled={isSaving || !documentData.permissions.canEdit}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Sauvegarder</span>
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Chargement de l'éditeur...</p>
            </div>
          </div>
        ) : (
          <div id="onlyoffice-editor" className="w-full h-full"></div>
        )}
        
        {!documentData.permissions.canEdit && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Lecture seule</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Vous n'avez pas les autorisations nécessaires pour modifier ce document.
                Contactez le propriétaire ou un administrateur pour demander l'accès en écriture.
              </p>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Retour
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
