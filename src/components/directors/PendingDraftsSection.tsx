import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Calendar
} from 'lucide-react';
import { DraftApprovalDialog } from './DraftApprovalDialog';
import api from '@/lib/axios';
import { formatDate } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';

interface Draft {
  _id: string;
  correspondanceId: {
    _id: string;
    subject: string;
    from_address: string;
    content: string;
  };
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  estimatedResponseTime: number;
  notes?: string;
  submittedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const PendingDraftsSection: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPendingDrafts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/correspondances/pending-drafts');
      setDrafts(response.data.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des drafts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les drafts en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDrafts();
  }, []);

  const handleViewDraft = (draft: Draft) => {
    setSelectedDraft(draft);
    setApprovalDialogOpen(true);
  };

  const handleDraftProcessed = () => {
    fetchPendingDrafts(); // Recharger la liste
    setSelectedDraft(null);
    setApprovalDialogOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Drafts en Attente d'Approbation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des drafts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Drafts en Attente d'Approbation
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {drafts.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={fetchPendingDrafts} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            🔄 Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Aucun draft en attente</p>
              <p className="text-sm text-gray-500">Tous les drafts ont été traités</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div 
                  key={draft._id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* En-tête du draft */}
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(draft.priority)}
                        <Badge className={getPriorityColor(draft.priority)}>
                          {draft.priority}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {draft.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {draft.estimatedResponseTime} jours
                        </div>
                      </div>

                      {/* Sujet de la correspondance */}
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {draft.correspondanceId.subject}
                        </h4>
                        <p className="text-sm text-gray-600">
                          De: {draft.correspondanceId.from_address}
                        </p>
                      </div>

                      {/* Aperçu du draft */}
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {draft.content.substring(0, 150)}
                          {draft.content.length > 150 && '...'}
                        </p>
                      </div>

                      {/* Informations sur le soumetteur */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {draft.submittedBy.firstName} {draft.submittedBy.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {draft.submittedBy.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(draft.createdAt)}</span>
                        </div>
                      </div>

                      {/* Notes internes */}
                      {draft.notes && (
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="text-xs text-gray-600">
                            <strong>Notes:</strong> {draft.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        onClick={() => handleViewDraft(draft)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Examiner
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'approbation */}
      <DraftApprovalDialog
        isOpen={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedDraft(null);
        }}
        draft={selectedDraft}
        onDraftProcessed={handleDraftProcessed}
      />
    </>
  );
};
