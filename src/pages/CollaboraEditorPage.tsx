import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, ArrowLeft, RefreshCw, ExternalLink, Save, AlertCircle } from 'lucide-react';

interface CollaboraConfig {
  editUrl: string;
  wopiSrc: string;
  accessToken: string;
  document: {
    id: string;
    name: string;
    type: string;
    size: number;
  };
}

const CollaboraEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [config, setConfig] = useState<CollaboraConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Vérifier le statut du serveur Collabora Online
  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/collabora/status');
      const data = await response.json();
      setServerStatus(data.success ? 'online' : 'offline');
      return data.success;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setServerStatus('offline');
      return false;
    }
  };

  // Initialiser l'éditeur Collabora Online
  const initializeEditor = async () => {
    if (!documentId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Vérifier le statut du serveur
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        throw new Error('Le serveur Collabora Online n\'est pas disponible');
      }

      // Obtenir la configuration d'édition
      const response = await fetch(`/api/collabora/edit/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'initialisation');
      }

      const collaboraConfig = await response.json();
      setConfig(collaboraConfig);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Collabora:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Gérer les messages de l'iframe Collabora
  const handleMessage = (event: MessageEvent) => {
    if (!config) return;

    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      switch (message.MessageId) {
        case 'App_LoadingStatus':
          if (message.Values?.Status === 'Document_Loaded') {
          }
          break;
          
        case 'Action_Save_Resp':
          setSaving(false);
          setLastSaved(new Date());
          break;
          
        case 'Action_Save':
          setSaving(true);
          break;
          
        case 'UI_Close':
          handleCloseEditor();
          break;
          
        default:
          // Autres messages Collabora
          break;
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
    }
  };

  // Fermer l'éditeur
  const handleCloseEditor = async () => {
    if (documentId && user) {
      try {
        await fetch(`/api/collabora/close/${documentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });
      } catch (error) {
        console.error('Erreur lors de la fermeture:', error);
      }
    }
    
    navigate(-1);
  };

  // Forcer la sauvegarde
  const forceSave = () => {
    if (iframeRef.current) {
      const message = {
        MessageId: 'Action_Save',
        SendTime: Date.now(),
        Values: {
          DontTerminateEdit: true,
          DontSaveIfUnmodified: true
        }
      };
      
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(message), '*');
    }
  };

  // Ouvrir dans un nouvel onglet
  const openInNewTab = () => {
    if (config) {
      window.open(config.editUrl, '_blank');
    }
  };

  useEffect(() => {
    initializeEditor();
    
    // Écouter les messages de l'iframe
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [documentId, user]);

  // Affichage du statut du serveur
  const renderServerStatus = () => {
    switch (serverStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Vérification du serveur...</span>
          </div>
        );
      case 'online':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Collabora Online connecté</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Serveur Collabora Online hors ligne</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-center">
                <h3 className="font-semibold">Chargement de l'éditeur</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Initialisation de Collabora Online...
                </p>
              </div>
              {renderServerStatus()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Erreur</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            {renderServerStatus()}
            
            <div className="flex space-x-2">
              <Button 
                onClick={initializeEditor}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Barre d'outils */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleCloseEditor}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Fermer
            </Button>
            
            <div className="flex flex-col">
              <h1 className="font-semibold text-gray-900">
                {config.document.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {renderServerStatus()}
                {lastSaved && (
                  <span>
                    Dernière sauvegarde: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={forceSave}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
            
            <Button
              onClick={openInNewTab}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Nouvel onglet
            </Button>
          </div>
        </div>
      </div>

      {/* Éditeur Collabora Online */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={config.editUrl}
          className="w-full h-full border-0"
          title={`Édition - ${config.document.name}`}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>

      {/* Indicateur de sauvegarde */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sauvegarde en cours...</span>
        </div>
      )}
    </div>
  );
};

export default CollaboraEditorPage;
