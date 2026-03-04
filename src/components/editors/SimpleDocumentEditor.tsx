import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2, ArrowLeft, X, Download, Edit3, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:5000/api';

const SimpleDocumentEditor: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDocument, setEditedDocument] = useState<any>({});

  // Determine entityType based on current URL path
  const entityType = window.location.pathname.includes('/documents/') ? 'document' :
                     window.location.pathname.includes('/correspondances/') ? 'correspondance' :
                     window.location.pathname.includes('/proces-verbaux/') ? 'proces-verbal' : 'unknown';

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setDocument(response.data.data);
          setEditedDocument(response.data.data);
        }
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur lors du chargement du document:', err);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger le document.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, user, toast]);

  const handleSave = async () => {
    if (!documentId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/documents/${documentId}`, {
        title: editedDocument.title,
        content: editedDocument.content,
        metadata: editedDocument.metadata,
        status: editedDocument.status
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDocument(editedDocument);
        setIsEditing(false);
        toast({
          title: 'Document sauvegardé',
          description: 'Les modifications ont été enregistrées avec succès.',
        });
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      }
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder les modifications.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (document) {
      const blob = new Blob([document.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.title || 'document'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-aviation-sky mx-auto mb-4" />
            <p className="text-gray-600">Chargement du document...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!document) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Document non trouvé</h2>
          <p className="text-gray-600 mb-4">Le document demandé n'existe pas ou n'est pas accessible.</p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Édition du document' : 'Visualisation du document'}
            </h1>
            <p className="text-gray-600">{document.title}</p>
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditedDocument(document);
                }}>
                  Annuler
                </Button>
              </>
            )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contenu du document</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre
                      </label>
                      <Input
                        value={editedDocument.title || ''}
                        onChange={(e) => setEditedDocument({
                          ...editedDocument,
                          title: e.target.value
                        })}
                        placeholder="Titre du document"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contenu
                      </label>
                      <Textarea
                        value={editedDocument.content || ''}
                        onChange={(e) => setEditedDocument({
                          ...editedDocument,
                          content: e.target.value
                        })}
                        placeholder="Contenu du document"
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {document.content || 'Aucun contenu disponible'}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informations du document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm">{document.type || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      document.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      document.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.status || 'DRAFT'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Aéroport</label>
                  <p className="text-sm">{document.airport || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="text-sm">
                    {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modifié le</label>
                  <p className="text-sm">
                    {document.updatedAt ? new Date(document.updatedAt).toLocaleDateString('fr-FR') : 'Non disponible'}
                  </p>
                </div>
                {document.qrCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">QR Code</label>
                    <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                      {document.qrCode}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Actions alternatives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">💡 Éditeur simple</p>
                  <p className="text-xs text-blue-700">
                    Cet éditeur permet de modifier le titre et le contenu textuel du document.
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ OnlyOffice indisponible</p>
                  <p className="text-xs text-yellow-700">
                    L'éditeur avancé OnlyOffice n'est pas disponible actuellement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SimpleDocumentEditor;
