
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Eye, Download, Edit, Archive, Clock } from 'lucide-react';
import { DocumentHistory } from '@/shared/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentLifecycleProps {
  documentId: string;
  history: DocumentHistory[];
}

export const DocumentLifecycle: React.FC<DocumentLifecycleProps> = ({
  documentId,
  history
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <FileText className="w-4 h-4" />;
      case 'VIEWED':
        return <Eye className="w-4 h-4" />;
      case 'DOWNLOADED':
        return <Download className="w-4 h-4" />;
      case 'UPDATED':
        return <Edit className="w-4 h-4" />;
      case 'ARCHIVED':
        return <Archive className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'bg-green-100 text-green-800';
      case 'VIEWED':
        return 'bg-blue-100 text-blue-800';
      case 'DOWNLOADED':
        return 'bg-purple-100 text-purple-800';
      case 'UPDATED':
        return 'bg-orange-100 text-orange-800';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'Créé';
      case 'VIEWED':
        return 'Consulté';
      case 'DOWNLOADED':
        return 'Téléchargé';
      case 'UPDATED':
        return 'Modifié';
      case 'ARCHIVED':
        return 'Archivé';
      case 'APPROVED':
        return 'Approuvé';
      case 'REJECTED':
        return 'Rejeté';
      default:
        return action;
    }
  };

  const filteredHistory = history.filter(entry => entry.documentId === documentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-aviation-sky" />
          Cycle de vie du document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun historique disponible</p>
          ) : (
            <div className="relative">
              {filteredHistory.map((entry, index) => (
                <div key={entry.id} className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(entry.action)}`}>
                        {getActionIcon(entry.action)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className={getActionColor(entry.action)}>
                            {getActionLabel(entry.action)}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            Version {entry.version}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(entry.timestamp, "dd/MM/yyyy HH:mm", { locale: fr })}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="text-sm text-gray-700 mt-2">{entry.comment}</p>
                      )}
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Modifications: {Object.keys(entry.changes).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < filteredHistory.length - 1 && (
                    <div className="absolute left-5 top-12 w-px h-8 bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
