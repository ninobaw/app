import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Phone,
  ExternalLink,
  History,
  Paperclip,
  Send,
  Archive
} from 'lucide-react';
import { formatDate } from '@/shared/utils';
import api from '@/lib/axios';

interface CorrespondanceDetailsDialogProps {
  correspondanceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CorrespondanceDetails {
  id: string;
  title: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  workflowStatus: string;
  createdAt: string;
  responseDate?: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
  };
  attachments: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
  finalResponse?: {
    id: string;
    content: string;
    attachments: Array<{
      name: string;
      path: string;
      size: number;
      type: string;
    }>;
    dischargeFiles: Array<{
      name: string;
      path: string;
      size: number;
      type: string;
      category: string;
      description?: string;
    }>;
    deliveryMethod: string;
    deliveryStatus: string;
    readStatus: string;
    sentAt: string;
    supervisorName: string;
    trackingNumber?: string;
    deliveryNotes?: string;
    recipientEmail?: string;
    recipientAddress?: any;
  };
  processingHistory: Array<{
    action: string;
    userName: string;
    timestamp: string;
    details?: any;
  }>;
}

export const CorrespondanceDetailsDialog: React.FC<CorrespondanceDetailsDialogProps> = ({
  correspondanceId,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState<CorrespondanceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && correspondanceId) {
      fetchCorrespondanceDetails();
    }
  }, [isOpen, correspondanceId]);

  const fetchCorrespondanceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/correspondances/${correspondanceId}/details`);
      if (response.data.success) {
        setDetails(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const response = await api.get(`/api/uploads/download/${encodeURIComponent(filePath)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPLIED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'OVERDUE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500';
      case 'IN_TRANSIT': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600">Impossible de charger les détails de la correspondance</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Détails de la correspondance</span>
            <Badge className={`${getStatusColor(details.status)} text-white`}>
              {details.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {details.title} • {formatDate(details.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="response">Réponse</TabsTrigger>
              <TabsTrigger value="attachments">Pièces jointes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Informations principales */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Mail className="w-5 h-5" />
                          <span>Informations principales</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Titre</label>
                            <p className="text-sm">{details.title}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Sujet</label>
                            <p className="text-sm">{details.subject}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Priorité</label>
                            <Badge variant={details.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                              {details.priority}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Auteur</label>
                            <p className="text-sm">{details.author.firstName} {details.author.lastName}</p>
                            <p className="text-xs text-gray-500">{details.author.email}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contenu</label>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{details.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statut et dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="w-5 h-5" />
                          <span>Statut et chronologie</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Créée le</label>
                            <p className="text-sm">{formatDate(details.createdAt)}</p>
                          </div>
                          {details.responseDate && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Répondue le</label>
                              <p className="text-sm">{formatDate(details.responseDate)}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-600">Statut workflow</label>
                            <Badge variant="outline">{details.workflowStatus}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="response" className="h-full">
                <ScrollArea className="h-full">
                  {details.finalResponse ? (
                    <div className="space-y-6">
                      {/* Informations de livraison */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Send className="w-5 h-5" />
                            <span>Statut de livraison</span>
                            <Badge className={`${getDeliveryStatusColor(details.finalResponse.deliveryStatus)} text-white`}>
                              {getDeliveryStatusIcon(details.finalResponse.deliveryStatus)}
                              <span className="ml-1">{details.finalResponse.deliveryStatus}</span>
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Méthode de livraison</label>
                              <p className="text-sm">{details.finalResponse.deliveryMethod}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Envoyée le</label>
                              <p className="text-sm">{formatDate(details.finalResponse.sentAt)}</p>
                            </div>
                            {details.finalResponse.trackingNumber && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Numéro de suivi</label>
                                <p className="text-sm font-mono">{details.finalResponse.trackingNumber}</p>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium text-gray-600">Finalisée par</label>
                              <p className="text-sm">{details.finalResponse.supervisorName}</p>
                            </div>
                          </div>
                          
                          {details.finalResponse.recipientEmail && (
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-600">Destinataire</label>
                              <p className="text-sm">{details.finalResponse.recipientEmail}</p>
                            </div>
                          )}
                          
                          {details.finalResponse.deliveryNotes && (
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-600">Notes de livraison</label>
                              <p className="text-sm">{details.finalResponse.deliveryNotes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Contenu de la réponse */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" />
                            <span>Contenu de la réponse</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{details.finalResponse.content}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Fichiers de décharge */}
                      {details.finalResponse.dischargeFiles.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Archive className="w-5 h-5" />
                              <span>Fichiers de décharge</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {details.finalResponse.dischargeFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    <div>
                                      <p className="text-sm font-medium">{file.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {file.category} • {formatFileSize(file.size)}
                                      </p>
                                      {file.description && (
                                        <p className="text-xs text-gray-600 mt-1">{file.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadFile(file.path, file.name)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réponse</h3>
                        <p className="text-gray-600">Cette correspondance n'a pas encore de réponse finalisée</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="attachments" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Pièces jointes de la correspondance */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Paperclip className="w-5 h-5" />
                          <span>Pièces jointes de la correspondance</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {details.attachments.length > 0 ? (
                          <div className="space-y-3">
                            {details.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {file.type} • {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(file.path, file.name)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune pièce jointe</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pièces jointes de la réponse */}
                    {details.finalResponse && details.finalResponse.attachments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Send className="w-5 h-5" />
                            <span>Pièces jointes de la réponse</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {details.finalResponse.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {file.type} • {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(file.path, file.name)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="h-full">
                <ScrollArea className="h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <History className="w-5 h-5" />
                        <span>Historique de traitement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {details.processingHistory.length > 0 ? (
                        <div className="space-y-4">
                          {details.processingHistory.map((event, index) => (
                            <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-b-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{event.action}</p>
                                  <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                                </div>
                                <p className="text-sm text-gray-600">{event.userName}</p>
                                {event.details && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    {Object.entries(event.details).map(([key, value]) => (
                                      <div key={key}>
                                        <span className="font-medium">{key}:</span> {String(value)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucun historique disponible</p>
                      )}
                    </CardContent>
                  </Card>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
