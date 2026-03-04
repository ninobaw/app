import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Crown
} from 'lucide-react';
import { useDGPendingTasks } from '@/hooks/useCorrespondanceWorkflow';
import { UnifiedChatDialog } from './UnifiedChatDialog';
import { formatDate } from '@/shared/utils';

interface ResponseDraft {
  directorId: string;
  directorName: string;
  directorate: string;
  responseContent: string;
  comments: string;
  status: string;
  createdAt: string;
  dgFeedbacks?: any[];
  revisionHistory?: any[];
}

interface PendingCorrespondance {
  _id: string;
  subject: string;
  priority: string;
  createdAt: string;
  workflowStatus: string;
  responseDrafts: ResponseDraft[];
}

export const DGResponseReviewPanel: React.FC = () => {
  const { data: pendingData, isLoading } = useDGPendingTasks();
  
  const [selectedCorrespondance, setSelectedCorrespondance] = useState<PendingCorrespondance | null>(null);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);

  const pendingCorrespondances = pendingData?.correspondances || [];

  const handleOpenConversation = (correspondance: PendingCorrespondance) => {
    setSelectedCorrespondance(correspondance);
    setConversationDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'LOW': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-500';
      case 'REVISED': return 'bg-blue-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center text-purple-800">
            <Crown className="w-5 h-5 mr-2" />
            Propositions de Réponse à Réviser
          </CardTitle>
          <CardDescription>
            Examinez et donnez votre feedback sur les propositions des directeurs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pendingCorrespondances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucune proposition en attente de révision</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCorrespondances.map((correspondance: PendingCorrespondance) => (
                <div
                  key={correspondance._id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                    correspondance.responseDrafts?.some(draft => draft.status === 'PENDING_DG_REVIEW') 
                      ? 'border-amber-300 bg-amber-50 shadow-md ring-2 ring-amber-200' 
                      : ''
                  }`}
                  onClick={() => handleOpenConversation(correspondance)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{correspondance.subject}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Créée le {formatDate(correspondance.createdAt)}</span>
                        <Badge variant="outline">{correspondance.workflowStatus}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={`${getPriorityColor(correspondance.priority)} text-white`}>
                        {correspondance.priority}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className={correspondance.responseDrafts?.some(draft => draft.status === 'PENDING_DG_REVIEW') 
                          ? 'bg-amber-100 text-amber-800 border-amber-300' 
                          : ''
                        }
                      >
                        {correspondance.responseDrafts?.length || 0} proposition(s)
                        {correspondance.responseDrafts?.some(draft => draft.status === 'PENDING_DG_REVIEW') && 
                          <span className="ml-1">🔔</span>
                        }
                      </Badge>
                    </div>
                  </div>

                  {/* Aperçu des propositions */}
                  {correspondance.responseDrafts && correspondance.responseDrafts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {correspondance.responseDrafts.map((draft, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{draft.directorName}</span>
                          </div>
                          <Badge className={`${getStatusColor(draft.status)} text-white text-xs`}>
                            {draft.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ouvrir conversation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de conversation unifié */}
      {selectedCorrespondance && (
        <UnifiedChatDialog
          correspondanceId={selectedCorrespondance._id}
          isOpen={conversationDialogOpen}
          onClose={() => {
            setConversationDialogOpen(false);
            setSelectedCorrespondance(null);
          }}
          correspondanceData={selectedCorrespondance}
        />
      )}
    </div>
  );
};
