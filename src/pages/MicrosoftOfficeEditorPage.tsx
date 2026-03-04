import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2, AlertCircle, XCircle, ArrowLeft, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const API_BASE_URL = 'http://localhost:5000/api';

interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
  lastModifiedDateTime: string;
}

interface EditorResponse {
  editUrl: string;
  driveItem: DriveItem;
}

const MicrosoftOfficeEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Determine entityType based on current URL path
  const entityType = window.location.pathname.includes('/documents/') ? 'document' :
                     window.location.pathname.includes('/correspondances/') ? 'correspondance' :
                     window.location.pathname.includes('/proces-verbaux/') ? 'proces-verbal' : 'unknown';

  // Check Microsoft authentication status
  const { data: authStatus, isLoading: isLoadingAuth, refetch: refetchAuthStatus } = useQuery({
    queryKey: ['microsoft-auth-status', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      const response = await axios.get(`${API_BASE_URL}/microsoft-office/auth-status/${user.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  // Get editor configuration
  const { data: editorData, isLoading: isLoadingEditor, error: editorError, refetch: refetchEditor } = useQuery<EditorResponse>({
    queryKey: ['microsoft-editor', documentId, entityType],
    queryFn: async () => {
      if (!documentId || !user?.id || entityType === 'unknown') {
        throw new Error('Document ID, user, or entity type not available');
      }
      const response = await axios.post(`${API_BASE_URL}/microsoft-office/editor`, {
        entityId: documentId,
        entityType: entityType,
        userId: user.id,
      });
      return response.data;
    },
    enabled: !!documentId && !!user?.id && entityType !== 'unknown' && authStatus?.isAuthenticated,
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!documentId || !user?.id) throw new Error('Missing required parameters');
      const response = await axios.post(`${API_BASE_URL}/microsoft-office/sync`, {
        entityId: documentId,
        entityType: entityType,
        userId: user.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Synchronisation réussie',
        description: `Document synchronisé depuis Office 365. Version: ${data.version}`,
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [entityType === 'document' ? 'documents' : entityType === 'correspondance' ? 'correspondances' : 'proces-verbaux'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.response?.data?.message || 'Impossible de synchroniser le document',
        variant: 'destructive',
      });
    },
  });

  // Handle Microsoft authentication
  const handleMicrosoftAuth = async () => {
    setIsAuthenticating(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/microsoft-office/auth-url`);
      const authWindow = window.open(response.data.authUrl, 'microsoft-auth', 'width=600,height=700');
      
      // Listen for the auth callback
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsAuthenticating(false);
          // Refetch auth status after a short delay
          setTimeout(() => {
            refetchAuthStatus();
          }, 1000);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error initiating Microsoft auth:', error);
      toast({
        title: 'Erreur d\'authentification',
        description: 'Impossible d\'initier l\'authentification Microsoft',
        variant: 'destructive',
      });
      setIsAuthenticating(false);
    }
  };

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
      navigate('/');
    }
  };

  const handleOpenInOffice = () => {
    if (editorData?.editUrl) {
      window.open(editorData.editUrl, '_blank');
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  if (isLoadingAuth) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky" />
          <p className="ml-4 text-gray-600">Vérification de l'authentification Microsoft...</p>
        </div>
      </AppLayout>
    );
  }

  // Show authentication required screen
  if (!authStatus?.isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                Authentification Microsoft Office 365 Requise
              </CardTitle>
              <CardDescription>
                Pour éditer des documents avec Microsoft Office 365, vous devez d'abord vous authentifier avec votre compte Microsoft.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Permissions Requises</AlertTitle>
                <AlertDescription>
                  L'application aura besoin d'accéder à vos fichiers OneDrive pour synchroniser les documents.
                  Vos fichiers resteront privés et ne seront utilisés que pour l'édition collaborative.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleMicrosoftAuth} 
                  disabled={isAuthenticating}
                  className="flex items-center gap-2"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isAuthenticating ? 'Authentification...' : 'Se connecter à Microsoft'}
                </Button>
                
                <Button variant="outline" onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isLoadingEditor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky" />
          <p className="ml-4 text-gray-600">Préparation de l'éditeur Office 365...</p>
        </div>
      </AppLayout>
    );
  }

  if (editorError) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                Erreur de Chargement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {(editorError as any)?.response?.data?.message || 'Impossible de charger l\'éditeur Office 365'}
              </p>
              
              <div className="flex gap-4">
                <Button onClick={() => refetchEditor()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Édition Microsoft Office 365</h1>
            <p className="text-gray-600">
              Document: {editorData?.driveItem?.name || 'Chargement...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Document Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Document Prêt pour l'Édition
            </CardTitle>
            <CardDescription>
              Votre document a été synchronisé avec OneDrive et est prêt pour l'édition collaborative.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editorData?.driveItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom du fichier</label>
                  <p className="text-sm">{editorData.driveItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dernière modification</label>
                  <p className="text-sm">
                    {new Date(editorData.driveItem.lastModifiedDateTime).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Instructions d'Édition</AlertTitle>
              <AlertDescription>
                1. Cliquez sur "Ouvrir dans Office 365" pour éditer le document<br/>
                2. Effectuez vos modifications dans l'interface Office 365<br/>
                3. Revenez ici et cliquez sur "Synchroniser" pour sauvegarder les changements dans SGDO
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button onClick={handleOpenInOffice} className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Ouvrir dans Office 365
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="flex items-center gap-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser'}
              </Button>
            </div>

            {syncMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Synchronisation Réussie</AlertTitle>
                <AlertDescription>
                  Le document a été synchronisé avec succès depuis Office 365.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Connecté à Microsoft Office 365
          </Badge>
        </div>
      </div>
    </AppLayout>
  );
};

export default MicrosoftOfficeEditorPage;
