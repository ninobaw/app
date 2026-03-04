import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Calendar, 
  User, 
  Building, 
  Tag, 
  FileText, 
  Download, 
  Eye, 
  ArrowDownLeft, 
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  Hash,
  Link2,
  Reply,
  Send,
  ExternalLink
} from 'lucide-react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils';
import type { CorrespondanceData } from '@/hooks/useCorrespondances';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { useAuth } from '@/contexts/AuthContext';
import { CreateResponseDialog } from './CreateResponseDialog';

interface CorrespondanceDetailDialogProps {
  correspondance: CorrespondanceData | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrespondanceSelect?: (correspondance: CorrespondanceData) => void;
}

export const CorrespondanceDetailDialog: React.FC<CorrespondanceDetailDialogProps> = ({
  correspondance,
  isOpen,
  onClose,
  onCorrespondanceSelect,
}) => {
  const { user } = useAuth();
  const { correspondances } = useCorrespondances();
  const [relatedCorrespondances, setRelatedCorrespondances] = useState<CorrespondanceData[]>([]);
  const [responseCorrespondance, setResponseCorrespondance] = useState<CorrespondanceData | null>(null);
  const [originalCorrespondance, setOriginalCorrespondance] = useState<CorrespondanceData | null>(null);
  const [isCreateResponseDialogOpen, setIsCreateResponseDialogOpen] = useState(false);

  useEffect(() => {
    if (!correspondance || !correspondances) return;

    // Trouver la correspondance de réponse si c'est une correspondance originale
    if (correspondance.type === 'INCOMING' && correspondance.status === 'REPLIED') {
      const response = correspondances.find((c: CorrespondanceData) => 
        c.parentCorrespondanceId === (correspondance._id || correspondance.id) ||
        c.originalCorrespondanceId === (correspondance._id || correspondance.id)
      );
      setResponseCorrespondance(response || null);
    }

    // Trouver la correspondance originale si c'est une réponse
    if (correspondance.isResponse || correspondance.type === 'OUTGOING') {
      const original = correspondances.find((c: CorrespondanceData) => 
        (correspondance.parentCorrespondanceId && (c._id || c.id) === correspondance.parentCorrespondanceId) ||
        (correspondance.originalCorrespondanceId && (c._id || c.id) === correspondance.originalCorrespondanceId)
      );
      setOriginalCorrespondance(original || null);
    }

    // Trouver toutes les correspondances liées
    const related = correspondances.filter((c: CorrespondanceData) => {
      const currentId = correspondance._id || correspondance.id;
      const cId = c._id || c.id;
      return (
        cId !== currentId && (
          c.parentCorrespondanceId === currentId ||
          c.originalCorrespondanceId === currentId ||
          (correspondance.parentCorrespondanceId && (cId === correspondance.parentCorrespondanceId || c.parentCorrespondanceId === correspondance.parentCorrespondanceId)) ||
          (correspondance.originalCorrespondanceId && (cId === correspondance.originalCorrespondanceId || c.originalCorrespondanceId === correspondance.originalCorrespondanceId))
        )
      );
    });
    setRelatedCorrespondances(related);
  }, [correspondance, correspondances]);

  if (!correspondance) return null;

  const handleViewRelatedCorrespondance = (relatedCorr: CorrespondanceData) => {
    if (onCorrespondanceSelect) {
      onCorrespondanceSelect(relatedCorr);
    }
  };

  const canCreateResponse = user?.role === 'SUPERVISEUR_BUREAU_ORDRE' && 
                           correspondance.type === 'INCOMING' && 
                           correspondance.status !== 'REPLIED';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REPLIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'INFORMATIF': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REPLIED': return <CheckCircle className="w-4 h-4" />;
      case 'INFORMATIF': return <Info className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'HIGH': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'MEDIUM': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'LOW': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'INCOMING' ? 
      <ArrowDownLeft className="w-5 h-5 text-purple-600" /> : 
      <ArrowUpRight className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Mail className="w-6 h-6 text-aviation-sky" />
            Détails de la Correspondance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card className="border-l-4 border-l-aviation-sky">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 flex items-center gap-2">
                    {getTypeIcon(correspondance.type)}
                    {correspondance.subject}
                  </CardTitle>
                  {correspondance.code && (
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {correspondance.code}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getPriorityColor(correspondance.priority)} flex items-center gap-1`}>
                    {getPriorityIcon(correspondance.priority)}
                    {correspondance.priority}
                  </Badge>
                  <Badge className={`${getStatusColor(correspondance.status)} flex items-center gap-1`}>
                    {getStatusIcon(correspondance.status)}
                    {correspondance.status === 'PENDING' ? 'En attente' :
                     correspondance.status === 'REPLIED' ? 'Répondu' : 'Informatif'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Informations de Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">De</p>
                      <p className="text-sm text-gray-900">{correspondance.from_address}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <ArrowDownLeft className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">À</p>
                      <p className="text-sm text-gray-900">{correspondance.to_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="w-4 h-4" />
                    Métadonnées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Aéroport</span>
                    </div>
                    <Badge variant="outline">{correspondance.airport}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Date de création</span>
                    </div>
                    <span className="text-sm text-gray-900">{formatDate(correspondance.created_at)}</span>
                  </div>
                  {correspondance.responseDate && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Date de réponse</span>
                        </div>
                        <span className="text-sm text-gray-900">{formatDate(correspondance.responseDate)}</span>
                      </div>
                    </>
                  )}
                  {correspondance.responseReference && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Réf. réponse</span>
                        </div>
                        <span className="text-sm text-gray-900 font-mono">{correspondance.responseReference}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4" />
                    Contenu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {correspondance.content}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {correspondance.tags && correspondance.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="w-4 h-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {correspondance.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="w-4 h-4" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(correspondance.qr_code, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir QR Code
                    </Button>
                    {correspondance.file_path && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = getAbsoluteFilePath(correspondance.file_path!);
                            link.download = `correspondance-${correspondance.code || correspondance.id}.${correspondance.file_type?.split('/')[1] || 'file'}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getAbsoluteFilePath(correspondance.file_path!), '_blank')}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Visualiser
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Information for INFORMATIF status */}
          {correspondance.status === 'INFORMATIF' && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                  <Info className="w-4 h-4" />
                  Informations de Suivi
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Cette correspondance est de type informatif et nécessite un suivi particulier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {correspondance.informationTransmittedTo && (
                    <div>
                      <p className="text-sm font-medium text-blue-800">Information transmise à :</p>
                      <p className="text-sm text-blue-700">{correspondance.informationTransmittedTo}</p>
                    </div>
                  )}
                  {correspondance.informationActions && (
                    <div>
                      <p className="text-sm font-medium text-blue-800">Actions prises :</p>
                      <p className="text-sm text-blue-700">{correspondance.informationActions}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-800">Statut d'accusé :</span>
                    <Badge variant={correspondance.informationAcknowledged ? "default" : "secondary"}>
                      {correspondance.informationAcknowledged ? "Accusé" : "En attente"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correspondance de réponse */}
          {responseCorrespondance && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-800">
                  <Reply className="w-4 h-4" />
                  Correspondance de Réponse
                </CardTitle>
                <CardDescription className="text-green-700">
                  Cette correspondance a été répondue par le superviseur bureau d'ordre.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Objet de la réponse :</p>
                      <p className="text-sm text-green-700">{responseCorrespondance.subject}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRelatedCorrespondance(responseCorrespondance)}
                      className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir la réponse
                    </Button>
                  </div>
                  {responseCorrespondance.responseReference && (
                    <div>
                      <p className="text-sm font-medium text-green-800">Référence de réponse :</p>
                      <p className="text-sm text-green-700 font-mono">{responseCorrespondance.responseReference}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-green-800">Date d'envoi :</p>
                    <p className="text-sm text-green-700">{formatDate(responseCorrespondance.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correspondance originale */}
          {originalCorrespondance && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-purple-800">
                  <Link2 className="w-4 h-4" />
                  Correspondance Originale
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Cette correspondance est une réponse à une correspondance entrante.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Objet original :</p>
                      <p className="text-sm text-purple-700">{originalCorrespondance.subject}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRelatedCorrespondance(originalCorrespondance)}
                      className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir l'original
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Expéditeur original :</p>
                    <p className="text-sm text-purple-700">{originalCorrespondance.from_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Date de réception :</p>
                    <p className="text-sm text-purple-700">{formatDate(originalCorrespondance.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Autres correspondances liées */}
          {relatedCorrespondances.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="w-4 h-4" />
                  Correspondances Liées ({relatedCorrespondances.length})
                </CardTitle>
                <CardDescription>
                  Autres correspondances dans le même fil de discussion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedCorrespondances.map((relatedCorr, index) => (
                    <div key={relatedCorr._id || relatedCorr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {relatedCorr.type === 'INCOMING' ? 
                            <ArrowDownLeft className="w-4 h-4 text-green-600" /> : 
                            <ArrowUpRight className="w-4 h-4 text-blue-600" />
                          }
                          <Badge className={`text-xs ${getStatusColor(relatedCorr.status)}`}>
                            {relatedCorr.status === 'PENDING' ? 'En attente' :
                             relatedCorr.status === 'REPLIED' ? 'Répondu' : 'Informatif'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{relatedCorr.subject}</p>
                        <p className="text-xs text-gray-500">{formatDate(relatedCorr.created_at)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRelatedCorrespondance(relatedCorr)}
                        className="ml-3 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bouton pour créer une réponse (pour superviseur bureau d'ordre) */}
          {canCreateResponse && (
            <Card className="border-aviation-sky bg-aviation-sky/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-aviation-sky">
                  <Send className="w-4 h-4" />
                  Actions Superviseur
                </CardTitle>
                <CardDescription>
                  En tant que superviseur bureau d'ordre, vous pouvez créer une réponse officielle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-aviation-sky hover:bg-aviation-sky/90 text-white"
                  onClick={() => setIsCreateResponseDialogOpen(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Créer une Réponse Officielle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Dialogue de création de réponse */}
      <CreateResponseDialog
        originalCorrespondance={correspondance}
        isOpen={isCreateResponseDialogOpen}
        onClose={() => setIsCreateResponseDialogOpen(false)}
        onResponseCreated={(response) => {
          // Rafraîchir les données ou naviguer vers la nouvelle réponse
          if (onCorrespondanceSelect) {
            onCorrespondanceSelect(response);
          }
          setIsCreateResponseDialogOpen(false);
        }}
      />
    </Dialog>
  );
};
