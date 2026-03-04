import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CollaboraEditor from '@/components/editors/CollaboraEditor';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';

interface DocumentData {
  id: string;
  name: string;
  status: string;
  version: string;
  updatedAt: string;
  permissions: {
    canEdit: boolean;
    canDownload: boolean;
    canPrint: boolean;
  };
  collaborators: Array<{
    id: string;
    name: string;
    role: string;
    email: string;
  }>;
  token?: string; // Ajout du token optionnel
}

export function DocumentEditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du document
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) {
        setError('Aucun identifiant de document fourni');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
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

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Document non trouvé');
          } else if (response.status === 403) {
            throw new Error('Vous n\'avez pas les droits pour accéder à ce document');
          } else {
            throw new Error('Erreur lors du chargement du document');
          }
        }

        const result = await response.json();
        const data = result.data || result;
        setDocumentData({
          id: data._id || data.id,
          name: data.title || data.name,
          status: data.status,
          version: data.currentVersion || data.version || '1.0.0',
          updatedAt: data.updatedAt,
          permissions: {
            canEdit: true,
            canDownload: true,
            canPrint: true
          },
          collaborators: data.collaborators || []
        });
      } catch (err) {
        console.error('Erreur lors du chargement du document:', err);
        setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
        
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le document. Redirection vers la liste des documents...',
          variant: 'destructive',
        });
        
        // Rediriger vers la liste des documents après un délai
        setTimeout(() => {
          navigate('/documents');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchDocument();
    }
  }, [documentId, user?.id, navigate, toast]);

  // Gérer la sauvegarde du document
  const handleSave = async (updatedDocument: any) => {
    if (!documentData) return;
    
    setDocumentData({
      ...documentData,
      ...updatedDocument,
      updatedAt: new Date().toISOString(),
    });
  };

  // Gérer le changement de statut
  const handleStatusChange = (newStatus: string) => {
    setDocumentData(prev => ({
      ...prev!,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Afficher le chargement
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement du document...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Afficher les erreurs
  if (error || !documentData) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-800">Erreur</h2>
            </div>
            <p className="text-red-700 mb-4">
              {error || 'Impossible de charger le document demandé.'}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate('/documents')}
                className="bg-red-600 hover:bg-red-700"
              >
                Voir tous les documents
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Vérifier que documentId est défini avant de rendre l'éditeur
  if (!documentId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Aucun identifiant de document fourni</p>
        </div>
      </AppLayout>
    );
  }

  // Rendu de l'éditeur
  return (
    <AppLayout>
      <CollaboraEditor documentId={documentId} entityType="document" />
    </AppLayout>
  );
}

export default DocumentEditorPage;
