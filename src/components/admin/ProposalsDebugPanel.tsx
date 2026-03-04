import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  RefreshCw, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProposalsDebug } from '@/hooks/useCorrespondanceWorkflow';
import { formatDate } from '@/shared/utils';

export const ProposalsDebugPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: debugData, isLoading, refetch } = useProposalsDebug();

  // Vérifier les permissions
  const canDebug = user?.role && ['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role);

  if (!canDebug) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>Accès refusé. Réservé aux administrateurs et DG.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = debugData?.stats || {};
  const correspondances = debugData?.correspondancesWithProposals || [];
  const workflowStates = debugData?.debugInfo?.workflowStates || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-500';
      case 'REVISED': return 'bg-blue-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'REVISION_REQUESTED': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="w-5 h-5 mr-2" />
            Diagnostic des Propositions de Réponse
          </CardTitle>
          <CardDescription>
            Analyse complète des propositions et du workflow pour identifier les problèmes
          </CardDescription>
          <div className="flex justify-end">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistiques générales */}
          <div>
            <h3 className="font-semibold mb-3">📊 Statistiques Générales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalCorrespondances || 0}
                </div>
                <div className="text-sm text-blue-800">Total Correspondances</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.correspondancesWithDrafts || 0}
                </div>
                <div className="text-sm text-green-800">Avec Propositions</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(stats.workflowStatuses || {}).length}
                </div>
                <div className="text-sm text-purple-800">Statuts Workflow</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(stats.draftStatuses || {}).length}
                </div>
                <div className="text-sm text-orange-800">Statuts Drafts</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statuts de workflow */}
          <div>
            <h3 className="font-semibold mb-3">🔄 Statuts de Workflow</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(stats.workflowStatuses || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{status || 'undefined'}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Statuts des drafts */}
          <div>
            <h3 className="font-semibold mb-3">📝 Statuts des Propositions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(stats.draftStatuses || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{status || 'undefined'}</span>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* États de workflow définis */}
          <div>
            <h3 className="font-semibold mb-3">⚙️ États de Workflow Définis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(workflowStates).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{key}</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">{value as string}</code>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Correspondances avec propositions */}
          <div>
            <h3 className="font-semibold mb-3">📋 Correspondances avec Propositions ({correspondances.length})</h3>
            
            {correspondances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucune correspondance avec proposition trouvée</p>
                <p className="text-sm mt-2">
                  Cela peut indiquer que les propositions ne sont pas correctement sauvegardées
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {correspondances.slice(0, 5).map((corresp: any, index: number) => (
                  <Card key={corresp.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{corresp.subject}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>ID: {corresp.id}</span>
                            <span>{formatDate(corresp.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="outline">
                            {corresp.workflowStatus || 'undefined'}
                          </Badge>
                          <Badge className="bg-blue-500 text-white">
                            {corresp.draftsCount} proposition(s)
                          </Badge>
                        </div>
                      </div>

                      {/* Détails des propositions */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Propositions :</h5>
                        {corresp.drafts.map((draft: any, draftIndex: number) => (
                          <div key={draftIndex} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Users className="w-4 h-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-sm">{draft.directorName}</span>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{formatDate(draft.createdAt)}</span>
                                  {draft.hasComments && (
                                    <Badge variant="outline" className="text-xs">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Commentaires
                                    </Badge>
                                  )}
                                  {draft.hasFeedbacks && (
                                    <Badge variant="outline" className="text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {draft.feedbacksCount} feedback(s)
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(draft.status)} text-white`}>
                              {draft.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {correspondances.length > 5 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      ... et {correspondances.length - 5} autres correspondances
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommandations */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Recommandations de Diagnostic</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Vérifiez que les propositions ont le bon statut (DRAFT ou REVISED)</li>
              <li>• Assurez-vous que le workflowStatus est correctement mis à jour</li>
              <li>• Contrôlez que les directeurs sont bien assignés aux correspondances</li>
              <li>• Vérifiez les logs backend lors de la création de propositions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
