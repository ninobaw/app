import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/axios';
import WorkflowChatPanel from '@/components/workflow/WorkflowChatPanel';

interface UnifiedChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  correspondanceId: string;
  correspondanceData: any;
}

export const UnifiedChatDialog: React.FC<UnifiedChatDialogProps> = ({
  isOpen,
  onClose,
  correspondanceId,
  correspondanceData
}) => {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer l'ID du workflow pour cette correspondance
  useEffect(() => {
    const fetchWorkflowId = async () => {
      if (!correspondanceId || !isOpen) {
        console.log('🚫 [UnifiedChat] Pas de correspondanceId ou dialog fermé');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔍 [UnifiedChat] Recherche workflow pour correspondance:', correspondanceId);
        
        const response = await api.get(`/api/workflow-chat/by-correspondance/${correspondanceId}`);
        console.log('📡 [UnifiedChat] Réponse API complète:', response.data);
        
        if (response.data.success && response.data.data) {
          const workflowIdFound = response.data.data._id;
          setWorkflowId(workflowIdFound);
          console.log('✅ [UnifiedChat] Workflow trouvé:', workflowIdFound);
        } else {
          console.log('⚠️ [UnifiedChat] Aucun workflow trouvé');
          setError('Aucun workflow trouvé pour cette correspondance');
        }
      } catch (error: any) {
        console.error('❌ [UnifiedChat] Erreur récupération workflow:', error);
        setError(error.response?.data?.message || 'Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowId();
  }, [correspondanceId, isOpen]);

  // Debug du render
  console.log('🎨 [UnifiedChat] Render avec:', {
    isOpen,
    correspondanceId,
    workflowId,
    isLoading,
    error
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat Unifié - {correspondanceData?.subject || 'Correspondance'}
          </DialogTitle>
          <DialogDescription>
            Communication centralisée entre DG et Directeur - Toutes les conversations en temps réel
          </DialogDescription>
        </DialogHeader>

        {/* Chat unifié sans onglets */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* En-tête du chat avec statut */}
            <div className="flex items-center gap-2 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Chat Unifié</h3>
              
              {/* Indicateur de statut */}
              {isLoading ? (
                <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100 text-yellow-800">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-600 mr-1"></div>
                  Connexion...
                </Badge>
              ) : workflowId ? (
                <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-1 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Non connecté
                </Badge>
              )}
              
              <div className="ml-auto text-sm text-gray-600">
                ID: {correspondanceId?.substring(0, 8)}...
              </div>
            </div>
            
            {/* Zone de chat */}
            <div className="flex-1 min-h-0">
              {error ? (
                <div className="h-full border rounded-lg bg-red-50 flex items-center justify-center">
                  <div className="text-center py-12 text-red-600">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de connexion</h3>
                    <p className="text-sm text-red-700 max-w-sm mx-auto mb-4">
                      {error}
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              ) : workflowId ? (
                <div className="h-full border rounded-lg overflow-hidden">
                  <WorkflowChatPanel 
                    workflowId={workflowId}
                    onMessageSent={() => {
                      console.log('💬 [UnifiedChat] Message envoyé dans le chat unifié');
                    }}
                  />
                </div>
              ) : (
                <div className="h-full border rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chat non disponible</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      {isLoading 
                        ? 'Recherche du workflow en cours...'
                        : 'Le workflow n\'est pas encore créé pour cette correspondance. Le chat unifié sera disponible une fois le workflow initialisé.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message d'information */}
        <div className="mt-4">
          <Separator />
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Communication Unifiée</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Ce dialogue unifie toutes les communications en temps réel entre le DG et le Directeur.
              Toutes les conversations sont centralisées dans le chat unifié.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedChatDialog;
