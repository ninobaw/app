import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  FileText, 
  Settings, 
  Mail, 
  CheckSquare, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { formatDateTime } from '@/shared/utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Interface locale pour les données de journal d'audit
interface ActivityLogData {
  id: string;
  _id?: string;
  action: string;
  details: Record<string, unknown> | string;
  entityId?: string;
  entityType?: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    language?: string;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}

interface ActivityLogListProps {
  logs: ActivityLogData[];
  isLoading: boolean;
}

export const ActivityLogList: React.FC<ActivityLogListProps> = ({ logs, isLoading }) => {
  const { user } = useAuth();
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const userLanguage = (user as any)?.language || 'fr'; // Type assertion temporaire

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const formatDetails = (details: Record<string, unknown> | string): string => {
    if (!details) return 'Aucun détail';
    
    let parsedDetails: Record<string, unknown> | string = details;
    
    if (typeof details === 'string') {
      try {
        parsedDetails = JSON.parse(details) as Record<string, unknown>;
      } catch (e) {
        return details;
      }
    }
    
    if (typeof parsedDetails === 'object' && parsedDetails !== null) {
      return Object.entries(parsedDetails)
        .map(([key, value]) => {
          if (value && typeof value === 'object') {
            return `${key}: ${JSON.stringify(value, null, 2)}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');
    }
    
    return String(parsedDetails);
  };
  
  const getEntityLink = (log: ActivityLogData) => {
    if (!log.entityType || !log.entityId) return null;
    
    const pathMap: Record<string, string> = {
      'user': '/admin/users',
      'document': '/documents',
      'correspondance': '/correspondances',
      'action': '/actions',
      'template': '/templates'
    };
    
    const basePath = pathMap[log.entityType.toLowerCase()];
    
    if (!basePath) return null;
    
    return `${basePath}/${log.entityId}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-aviation-sky" />
            <CardTitle>Chargement des journaux d'audit...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-aviation-sky border-t-transparent"></div>
            <p className="text-gray-600">Récupération des journaux en cours...</p>
            <p className="text-sm text-gray-500">Veuillez patienter pendant le chargement des données.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent className="space-y-4">
          <div className="bg-aviation-50 p-4 rounded-full inline-flex items-center justify-center">
            <Clock className="w-12 h-12 text-aviation-sky" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun journal d'activité trouvé
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Aucune activité n'a encore été enregistrée dans le système ou les journaux n'ont pas pu être chargés.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary', label: string }> = {
      'success': { variant: 'default', label: 'Succès' },
      'error': { variant: 'destructive', label: 'Erreur' },
      'warning': { variant: 'outline', label: 'Avertissement' },
      'info': { variant: 'secondary', label: 'Info' },
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { variant: 'secondary' as const, label: status };
    
    return (
      <Badge 
        variant={statusInfo.variant}
        className={cn(
          'ml-2',
          status.toLowerCase() === 'success' ? 'bg-green-500 hover:bg-green-600' : ''
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return <User className="w-4 h-4 text-green-600" />;
      case 'USER_LOGOUT': return <User className="w-4 h-4 text-red-600" />;
      case 'DOCUMENT_CREATED': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'DOCUMENT_UPDATED': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'DOCUMENT_DELETED': return <FileText className="w-4 h-4 text-red-600" />;
      case 'DOCUMENT_APPROVED': return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'ACTION_CREATED': return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case 'ACTION_UPDATED': return <CheckSquare className="w-4 h-4 text-orange-600" />;
      case 'ACTION_COMPLETED': return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'REPORT_GENERATED': return <Settings className="w-4 h-4 text-indigo-600" />;
      case 'CORRESPONDANCE_SENT': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'PROCES_VERBAL_CREATED': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'SETTINGS_UPDATED': return <Settings className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return 'bg-green-100 text-green-800';
      case 'USER_LOGOUT': return 'bg-red-100 text-red-800';
      case 'DOCUMENT_CREATED': return 'bg-blue-100 text-blue-800';
      case 'DOCUMENT_UPDATED': return 'bg-orange-100 text-orange-800';
      case 'DOCUMENT_DELETED': return 'bg-red-100 text-red-800';
      case 'DOCUMENT_APPROVED': return 'bg-emerald-100 text-emerald-800';
      case 'ACTION_CREATED': return 'bg-purple-100 text-purple-800';
      case 'ACTION_UPDATED': return 'bg-orange-100 text-orange-800';
      case 'ACTION_COMPLETED': return 'bg-green-100 text-green-800';
      case 'REPORT_GENERATED': return 'bg-indigo-100 text-indigo-800';
      case 'CORRESPONDANCE_SENT': return 'bg-blue-100 text-blue-800';
      case 'PROCES_VERBAL_CREATED': return 'bg-orange-100 text-orange-800';
      case 'SETTINGS_UPDATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-aviation-sky" />
            <CardTitle>Chargement des journaux d'audit...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-aviation-sky border-t-transparent"></div>
            <p className="text-gray-600">Récupération des journaux en cours...</p>
            <p className="text-sm text-gray-500">Veuillez patienter pendant le chargement des données.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent className="space-y-4">
          <div className="bg-aviation-50 p-4 rounded-full inline-flex items-center justify-center">
            <Clock className="w-12 h-12 text-aviation-sky" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun journal d'activité trouvé
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Aucune activité n'a encore été enregistrée dans le système ou les journaux n'ont pas pu être chargés.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-aviation-sky" />
            <CardTitle className="text-lg">
              Journal d'Audit
              <span className="ml-2 text-sm font-normal text-gray-500">
                {logs.length} entrée{logs.length > 1 ? 's' : ''}
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[180px]">Date & Heure</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="w-[120px]">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const isExpanded = expandedLogs[log.id];
                const entityLink = getEntityLink(log);
                const formattedDetails = formatDetails(log.details);
                
                return (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={cn(
                        'cursor-pointer hover:bg-gray-50',
                        isExpanded && 'bg-gray-50'
                      )}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <TableCell className="py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(log.timestamp, userLanguage)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                            </div>
                            {log.user?.email && (
                              <div className="text-xs text-gray-500">
                                {log.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'whitespace-nowrap',
                            getActionBadgeColor(log.action)
                          )}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="line-clamp-1 text-sm">
                          {typeof formattedDetails === 'string' 
                            ? formattedDetails.split('\n')[0] 
                            : JSON.stringify(formattedDetails).substring(0, 100)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.entityType ? (
                          <Badge variant="outline" className="text-xs">
                            {log.entityType.toLowerCase()}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entityId ? (
                          <div className="flex items-center space-x-1">
                            <code className="text-xs font-mono text-gray-500">
                              {log.entityId.substring(0, 6)}...
                            </code>
                            {entityLink && (
                              <a 
                                href={entityLink}
                                onClick={(e) => e.stopPropagation()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-aviation-sky"
                                title="Voir l'entité"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.ipAddress ? (
                          <span className="text-xs font-mono text-gray-600">
                            {log.ipAddress}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Détails complets</h4>
                                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">
                                  {typeof formattedDetails === 'string' 
                                    ? formattedDetails 
                                    : JSON.stringify(formattedDetails, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Métadonnées</h4>
                                <dl className="space-y-2">
                                  <div className="flex justify-between">
                                    <dt className="text-gray-500">ID du journal:</dt>
                                    <dd className="font-mono text-xs">{log.id}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-500">Date exacte:</dt>
                                    <dd>{new Date(log.timestamp).toISOString()}</dd>
                                  </div>
                                  {log.userAgent && (
                                    <div className="flex justify-between">
                                      <dt className="text-gray-500">Navigateur:</dt>
                                      <dd className="text-xs">{log.userAgent}</dd>
                                    </div>
                                  )}
                                  {log.status && (
                                    <div className="flex justify-between">
                                      <dt className="text-gray-500">Statut:</dt>
                                      <dd>
                                        {getStatusBadge(log.status)}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {logs.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <div>
              Affichage de <span className="font-medium">{Math.min(logs.length, 100)}</span> entrées
              {logs.length > 100 && ' (limité aux 100 plus récentes)'}
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-aviation-sky hover:underline flex items-center"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Haut de page
              </button>
              <button 
                className="text-aviation-sky hover:underline flex items-center"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                Bas de page
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Composants d'aide commentés car non utilisés pour l'instant
// Peuvent être décommentés et utilisés si nécessaire à l'avenir
/*
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 border-2 border-aviation-sky border-t-transparent rounded-full animate-spin"></div>
    <span>Chargement...</span>
  </div>
);

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="bg-red-50 border-l-4 border-red-400 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <div className="mt-2">
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Réessayer<span className="sr-only">, réessayer le chargement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
*/