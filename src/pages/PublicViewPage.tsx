import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Mail, ClipboardList, Calendar, User, Download, Eye, QrCode, Info, Hash, Building2, BookOpen, CheckCircle, Loader2, XCircle, Tag // Added Tag
} from 'lucide-react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils';
import { DocumentData } from '@/hooks/useDocuments';
import { CorrespondanceData } from '@/hooks/useCorrespondances';
import { ProcesVerbalData } from '@/hooks/useProcesVerbaux';

const API_BASE_URL = 'http://localhost:5000/api';

type PublicItem = DocumentData | CorrespondanceData | ProcesVerbalData;

const PublicViewPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [itemType, setItemType] = useState<string | null>(null);

  useEffect(() => {
    if (type) {
      // Normalize type for API calls
      if (type === 'document') setItemType('documents');
      else if (type === 'correspondance') setItemType('correspondances');
      else if (type === 'proces-verbal') setItemType('proces-verbaux');
      else setItemType(null); // Invalid type
    }
  }, [type]);

  const { data: item, isLoading, error } = useQuery<PublicItem, Error>({
    queryKey: ['publicView', itemType, id],
    queryFn: async () => {
      if (!itemType || !id) throw new Error('Type ou ID manquant.');
      const response = await axios.get(`${API_BASE_URL}/${itemType}/${id}`);
      return response.data;
    },
    enabled: !!itemType && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-aviation-sky mx-auto mb-4" />
          <p className="text-xl text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <XCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p className="text-xl text-gray-600">
            {error?.message || "Impossible de charger les informations. L'élément n'existe peut-être pas ou le lien est invalide."}
          </p>
          <Button onClick={() => window.history.back()} className="mt-6">Retour</Button>
        </div>
      </div>
    );
  }

  const renderDocumentDetails = (doc: DocumentData) => (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{doc.title}</CardTitle>
          <Badge className={`text-sm ${getStatusColor(doc.status)}`}>
            {getStatusLabel(doc.status)}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          <Badge variant="secondary" className="text-xs mr-2">
            {getTypeLabel(doc.type)}
          </Badge>
          Version: {doc.version}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {doc.content && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <BookOpen className="w-4 h-4 mr-2" />
              Contenu / Description
            </h4>
            <p className="text-gray-800 whitespace-pre-wrap">{doc.content}</p>
          </div>
        )}
        {doc.tags && doc.tags.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {doc.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </>
  );

  const renderCorrespondanceDetails = (corr: CorrespondanceData) => (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{corr.subject}</CardTitle>
          <div className="flex space-x-2">
            <Badge className={`text-sm ${getPriorityColor(corr.priority)}`}>
              {corr.priority}
            </Badge>
            <Badge className={`text-sm ${getStatusColor(corr.status)}`}>
              {corr.status}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          De: <span className="font-medium">{corr.from_address}</span> à: <span className="font-medium">{corr.to_address}</span>
        </p>
        {corr.code && (
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
            Code: {corr.code}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 flex items-center mb-2">
            <BookOpen className="w-4 h-4 mr-2" />
            Contenu
          </h4>
          <p className="text-gray-800 whitespace-pre-wrap">{corr.content}</p>
        </div>
        {corr.tags && corr.tags.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {corr.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        {corr.actions_decidees && corr.actions_decidees.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <ClipboardList className="w-4 h-4 mr-2" />
              Actions Décidées
            </h4>
            <ul className="list-disc list-inside ml-4 text-gray-800">
              {corr.actions_decidees.map((action, index) => (
                <li key={index}>
                  {action.titre} (Échéance: {action.echeance}, Statut: {action.statut})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </>
  );

  const renderProcesVerbalDetails = (pv: ProcesVerbalData) => (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{pv.title}</CardTitle>
          <Badge className="text-sm bg-blue-100 text-blue-800">
            {pv.meeting_type}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Date: <span className="font-medium">{formatDate(pv.meeting_date)}</span> à <span className="font-medium">{pv.location}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 flex items-center mb-2">
            <BookOpen className="w-4 h-4 mr-2" />
            Ordre du Jour
          </h4>
          <p className="text-gray-800 whitespace-pre-wrap">{pv.agenda}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 flex items-center mb-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            Décisions
          </h4>
          <p className="text-gray-800 whitespace-pre-wrap">{pv.decisions}</p>
        </div>
        {pv.participants && pv.participants.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <User className="w-4 h-4 mr-2" />
              Participants
            </h4>
            <ul className="list-disc list-inside ml-4 text-gray-800">
              {pv.participants.map((p, index) => <li key={index}>{p}</li>)}
            </ul>
          </div>
        )}
        {pv.actions_decidees && pv.actions_decidees.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <ClipboardList className="w-4 h-4 mr-2" />
              Actions Décidées
            </h4>
            <ul className="list-disc list-inside ml-4 text-gray-800">
              {pv.actions_decidees.map((action, index) => (
                <li key={index}>
                  {action.titre} (Échéance: {action.echeance}, Statut: {action.statut})
                </li>
              ))}
            </ul>
          </div>
        )}
        {pv.next_meeting_date && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              Prochaine Réunion
            </h4>
            <p className="text-gray-800">{formatDate(pv.next_meeting_date)}</p>
          </div>
        )}
      </CardContent>
    </>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'RECEIVED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'ARCHIVED': return 'Archivé';
      case 'SENT': return 'Envoyée';
      case 'RECEIVED': return 'Reçue';
      default: return status;
    }
  };

  const getTypeLabel = (docType: string) => {
    switch (docType) {
      case 'QUALITE_DOC': return 'Document Qualité';
      case 'NOUVEAU_DOC': return 'Nouveau Document';
      case 'FORMULAIRE_DOC': return 'Formulaire';
      case 'GENERAL': return 'Manuel / Instruction';
      case 'TEMPLATE': return 'Modèle';
      case 'CORRESPONDANCE': return 'Correspondance';
      case 'PROCES_VERBAL': return 'Procès-Verbal';
      default: return docType;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconForType = (itemType: string) => {
    switch (itemType) {
      case 'documents': return <FileText className="w-5 h-5 mr-2 text-aviation-sky" />;
      case 'correspondances': return <Mail className="w-5 h-5 mr-2 text-aviation-sky" />;
      case 'proces-verbaux': return <ClipboardList className="w-5 h-5 mr-2 text-aviation-sky" />;
      default: return <Info className="w-5 h-5 mr-2 text-aviation-sky" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            {getIconForType(itemType || '')}
            Détails de l'élément
          </h1>
          <Button onClick={() => window.history.back()} variant="outline">Retour</Button>
        </div>

        <Card>
          {itemType === 'documents' && renderDocumentDetails(item as DocumentData)}
          {itemType === 'correspondances' && renderCorrespondanceDetails(item as CorrespondanceData)}
          {itemType === 'proces-verbaux' && renderProcesVerbalDetails(item as ProcesVerbalData)}
        </Card>

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
                <span>Auteur: {item.author?.first_name} {item.author?.last_name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Créé le: {formatDate(item.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Dernière mise à jour: {formatDate(item.updated_at)}</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-500" />
                <span>Vues: {item.views_count}</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-2 text-gray-500" />
                <span>Téléchargements: {item.downloads_count}</span>
              </div>
              {'approved_by' in item && item.approved_by && item.approved_at && (
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Approuvé par {item.approved_by.first_name} {item.approved_by.last_name} le {formatDate(item.approved_at)}</span>
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
                <span>Aéroport: {item.airport}</span>
              </div>
              {item.company_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Société: {item.company_code}</span>
                </div>
              )}
              {item.scope_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Scope: {item.scope_code}</span>
                </div>
              )}
              {item.department_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Département: {item.department_code}</span>
                </div>
              )}
              {item.sub_department_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Sous-Département: {item.sub_department_code}</span>
                </div>
              )}
              {'document_type_code' in item && item.document_type_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Type Doc: {item.document_type_code}</span>
                </div>
              )}
              {item.language_code && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Code Langue: {item.language_code}</span>
                </div>
              )}
              {item.sequence_number && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Numéro de Séquence: {String(item.sequence_number).padStart(3, '0')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Code QR & Fichier Associé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="text-center">
                {item.qr_code ? (
                  <>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.qr_code)}`}
                      alt={`QR Code pour ${'title' in item ? item.title : item.subject}`}
                      className="mx-auto border rounded-lg p-2"
                    />
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-2">
                      {item.qr_code.length > 30 ? `${item.qr_code.substring(0, 27)}...` : item.qr_code}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Aucun QR Code généré.</p>
                )}
              </div>
              <div className="flex-1 space-y-3">
                {item.file_path ? (
                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <p className="text-sm text-gray-700">
                      Type de fichier: {item.file_type || 'N/A'}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(getAbsoluteFilePath(item.file_path!), '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualiser
                      </Button>
                      <Button
                        onClick={() => {
                          const link = window.document.createElement('a');
                          link.href = getAbsoluteFilePath(item.file_path!);
                          link.download = 'title' in item ? item.title : item.subject || 'document';
                          window.document.body.appendChild(link);
                          link.click();
                          window.document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center md:text-left py-4">Aucun fichier associé à cet élément.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicViewPage;