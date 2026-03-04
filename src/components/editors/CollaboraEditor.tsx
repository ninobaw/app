import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:5000/api';

interface CollaboraEditorProps {
  documentId: string;
  entityType: 'document' | 'correspondance' | 'proces-verbal';
}

const CollaboraEditor: React.FC<CollaboraEditorProps> = ({ documentId, entityType }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wopiUrl, setWopiUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const initializeCollabora = async () => {
      if (!documentId || !user?.id) {
        setError('Document ID ou utilisateur non disponible.');
        setIsLoading(false);
        return;
      }

      try {
        // Obtenir l'URL WOPI pour Collabora
        const response = await axios.post(`${API_BASE_URL}/collabora/editor`, {
          entityId: documentId,
          entityType: entityType,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success && response.data.config.wopiUrl) {
          setWopiUrl(response.data.config.wopiUrl);
        } else {
          throw new Error('URL WOPI non reçue du serveur');
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur lors de l\'initialisation de Collabora:', err);
        setError(err.response?.data?.message || 'Impossible de charger l\'éditeur Collabora.');
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement de l\'éditeur',
          description: err.response?.data?.message || 'Impossible de charger l\'éditeur Collabora.',
          variant: 'destructive',
        });
      }
    };

    initializeCollabora();
  }, [documentId, user, toast, entityType]);

  const handleGoBack = () => {
    if (entityType === 'document') {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate('/documents');
    } else if (entityType === 'correspondance') {
      queryClient.invalidateQueries({ queryKey: ['correspondances'] });
      navigate('/correspondances');
    } else if (entityType === 'proces-verbal') {
      queryClient.invalidateQueries({ queryKey: ['proces-verbaux'] });
      navigate('/proces-verbaux');
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-aviation-sky mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Chargement de l'éditeur Collabora...</p>
          <p className="text-sm text-gray-500">Initialisation en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-red-600">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  if (!wopiUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-orange-400 mb-6" />
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Éditeur Non Disponible</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">L'éditeur Collabora n'est pas configuré.</p>
            <p className="text-xs text-gray-500">Contactez l'administrateur système.</p>
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Édition du document</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button variant="destructive" onClick={handleGoBack}>
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          src={wopiUrl}
          className="w-full h-full border-0"
          title="Collabora Online Editor"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};

export default CollaboraEditor;
