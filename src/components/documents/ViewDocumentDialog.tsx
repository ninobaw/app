import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  User,
  Download,
  Eye,
  QrCode,
  Tag,
  Info,
  Hash,
  Globe,
  Building2,
  BookOpen,
  FileDown,
  CheckCircle, // Import CheckCircle icon
} from 'lucide-react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils';
import { DocumentData } from '@/hooks/useDocuments';

interface ViewDocumentDialogProps {
  document: DocumentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewDocumentDialog: React.FC<ViewDocumentDialogProps> = ({ document, open, onOpenChange }) => {
  if (!document) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'ARCHIVED': return 'Archivé';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'QUALITE_DOC': return 'Document Qualité';
      case 'NOUVEAU_DOC': return 'Nouveau Document';
      case 'FORMULAIRE_DOC': return 'Formulaire';
      case 'GENERAL': return 'Manuel / Instruction';
      case 'TEMPLATE': return 'Modèle';
      default: return type;
    }
  };

  const generateQRCodeImage = (qrCodeValue: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeValue)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Détails du Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section principale du document */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">{document.title}</CardTitle>
                <Badge className={`text-sm ${getStatusColor(document.status)}`}>
                  {getStatusLabel(document.status)}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                <Badge variant="secondary" className="text-xs mr-2">
                  {getTypeLabel(document.type)}
                </Badge>
                Version: {document.version}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.content && (
                <div>
                  <h4 className="font-semibold text-gray-700 flex items-center mb-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Contenu / Description
                  </h4>
                  <p className="text-gray-800 whitespace-pre-wrap">{document.content}</p>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 flex items-center mb-2">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métadonnées et Codification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Auteur: {document.author?.firstName} {document.author?.lastName}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Créé le: {formatDate(document.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Dernière mise à jour: {formatDate(document.updated_at)}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Vues: {document.views_count}</span>
                </div>
                <div className="flex items-center">
                  <FileDown className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Téléchargements: {document.downloads_count}</span>
                </div>
                {document.approved_by && document.approved_at && (
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Approuvé par {document.approved_by.first_name} {document.approved_by.last_name} le {formatDate(document.approved_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Codification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Aéroport: {document.airport}</span>
                </div>
                {document.company_code && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Société: {document.company_code}</span>
                  </div>
                )}
                {document.scope_code && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Scope: {document.scope_code}</span>
                  </div>
                )}
                {document.department_code && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Département: {document.department_code}</span>
                  </div>
                )}
                {document.sub_department_code && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Sous-Département: {document.sub_department_code}</span>
                  </div>
                )}
                {document.document_type_code && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Type Doc: {document.document_type_code}</span>
                  </div>
                )}
                {document.language_code && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Code Langue: {document.language_code}</span>
                  </div>
                )}
                {document.sequence_number && (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Numéro de Séquence: {String(document.sequence_number).padStart(3, '0')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code et Fichier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  Code QR
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                {document.qr_code ? (
                  <>
                    <img
                      src={generateQRCodeImage(document.qr_code)}
                      alt={`QR Code pour ${document.title}`}
                      className="mx-auto border rounded-lg p-2"
                    />
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                      {document.qr_code.length > 30 ? `${document.qr_code.substring(0, 27)}...` : document.qr_code}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => window.open(document.qr_code, '_blank')} // Open QR code URL directly
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualiser le lien
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500">Aucun QR Code généré pour ce document.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Fichier Associé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {document.file_path ? (
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-sm text-gray-700">
                      Type de fichier: {document.file_type || 'N/A'}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(getAbsoluteFilePath(document.file_path!), '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualiser
                      </Button>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = getAbsoluteFilePath(document.file_path!);
                          link.download = document.title;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun fichier associé à ce document.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};