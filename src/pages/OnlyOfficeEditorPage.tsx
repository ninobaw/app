import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2, AlertCircle, XCircle, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:5000/api';

const OnlyOfficeEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>(); // This is actually the item's ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editorConfig, setEditorConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);

  // Determine entityType based on current URL path
  const entityType = window.location.pathname.includes('/documents/') ? 'document' :
                     window.location.pathname.includes('/correspondances/') ? 'correspondance' :
                     window.location.pathname.includes('/proces-verbaux/') ? 'proces-verbal' : 'unknown';

  useEffect(() => {
    const fetchEditorConfig = async () => {
      if (!documentId || !user?.id || entityType === 'unknown') {
        setErrorConfig('Document ID, user, or entity type not available.');
        setIsLoadingConfig(false);
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/onlyoffice/editor`, {
          entityId: documentId, // Renamed to entityId to be generic
          entityType: entityType, // Pass the determined entity type
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
        });
        setEditorConfig(response.data.config);
        setIsLoadingConfig(false);
      } catch (err: any) {
        console.error('Failed to fetch OnlyOffice editor config:', err);
        setErrorConfig(err.response?.data?.message || 'Échec du chargement de la configuration de l\'éditeur.');
        setIsLoadingConfig(false);
        toast({
          title: 'Erreur de chargement de l\'éditeur',
          description: err.response?.data?.message || 'Impossible de charger la configuration de l\'éditeur OnlyOffice.',
          variant: 'destructive',
        });
      }
    };

    fetchEditorConfig();
  }, [documentId, user, toast, entityType]); // Add entityType to dependencies

  useEffect(() => {
    if (editorConfig) {
      const showFallbackEditor = () => {
        const container = document.getElementById('onlyoffice-editor-container');
        if (container) {
          container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <div class="text-center max-w-lg">
                <div class="mb-6">
                  <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Éditeur de Document</h3>
                <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
                  <p class="text-sm text-gray-600 mb-2"><strong>Document:</strong></p>
                  <p class="font-medium text-gray-800">${editorConfig?.document?.title || 'Document'}</p>
                </div>
                <div class="space-y-4">
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm font-medium text-yellow-800 mb-2">⚠️ Serveurs d'édition non disponibles</p>
                    <div class="text-xs text-yellow-700 space-y-1">
                      <p>• OnlyOffice Docker: Non démarré</p>
                      <p>• Serveur public: Indisponible</p>
                    </div>
                  </div>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm font-medium text-blue-800 mb-2">💡 Solutions alternatives:</p>
                    <div class="text-xs text-blue-700 space-y-1">
                      <p>1. Télécharger le document pour l'éditer localement</p>
                      <p>2. Utiliser l'éditeur de métadonnées intégré</p>
                      <p>3. Démarrer Docker: <code class="bg-blue-100 px-1 rounded">docker-compose -f docker-simple-onlyoffice.yml up -d</code></p>
                    </div>
                  </div>
                  <div class="flex space-x-3 justify-center mt-6">
                    <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                      🔄 Réessayer
                    </button>
                    <button onclick="window.open('/documents/${documentId}/download', '_blank')" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                      📥 Télécharger
                    </button>
                    <button onclick="window.history.back()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                      ← Retour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      };
      
      // Show fallback interface since we're replacing OnlyOffice with Collabora
      console.log('🔄 Affichage de l\'interface de remplacement Collabora...');
      showFallbackEditor();
    }
  }, [editorConfig]);

  const handleGoBack = () => {
    // Invalidate relevant caches based on entityType
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
      navigate('/'); // Fallback to dashboard
    }
  };

  if (isLoadingConfig) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky" />
          <p className="ml-4 text-gray-600">Chargement de la configuration de l'éditeur...</p>
        </div>
      </AppLayout>
    );
  }

  if (errorConfig) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-red-600">
          <XCircle className="w-16 h-16 mb-4" />
          <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
          <p className="text-center">{errorConfig}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Retour</button>
        </div>
      </AppLayout>
    );
  }

  // Debug: Log editor config to see what we have
  console.log('Editor Config:', editorConfig);
  
  if (!editorConfig) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-orange-600">
          <AlertCircle className="w-16 h-16 mb-4" />
          <h2 className="text-xl font-bold mb-2">Configuration de l'éditeur manquante</h2>
          <p className="text-center">La configuration de l'éditeur n'a pas pu être chargée.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Retour</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Édition du document : {editorConfig?.document?.title || 'Chargement...'}</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux documents
            </Button>
            <Button variant="destructive" onClick={handleGoBack}>
              <X className="w-4 h-4 mr-2" />
              Quitter l'éditeur
            </Button>
          </div>
        </div>
        <div id="onlyoffice-editor-container" className="flex-1 border rounded-lg overflow-hidden" style={{ minHeight: '700px' }}>
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-aviation-sky mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Chargement de l'éditeur OnlyOffice...</p>
              <p className="text-sm text-gray-500">Tentative de connexion au serveur...</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Extend Window interface to include DocsAPI
declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (elementId: string, config: any) => any;
      // Add other DocsAPI properties/methods if needed
    };
  }
}

export default OnlyOfficeEditorPage;