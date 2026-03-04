import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import api from '@/lib/axios';
import WorkflowChatPanel from '@/components/workflow/WorkflowChatPanel';

interface UnifiedChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  correspondanceId: string;
  correspondanceData: any;
  autoCloseOnMessage?: boolean; // Option pour fermer automatiquement après envoi
}

export const UnifiedChatDialog: React.FC<UnifiedChatDialogProps> = ({
  isOpen,
  onClose,
  correspondanceId,
  correspondanceData,
  autoCloseOnMessage = false
}) => {
  const { user } = useAuth();
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
        console.log('🔍 [UnifiedChat] URL complète:', `/api/workflow-chat/by-correspondance/${correspondanceId}`);
        console.log('👤 [UnifiedChat] Utilisateur connecté:', {
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          role: user?.role,
          email: user?.email
        });
        
        const response = await api.get(`/api/workflow-chat/by-correspondance/${correspondanceId}`);
        console.log('📡 [UnifiedChat] Réponse API complète:', response.data);
        console.log('📡 [UnifiedChat] Status de la réponse:', response.status);
        console.log('📡 [UnifiedChat] Headers de la réponse:', response.headers);
        
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
      <DialogContent className="max-w-7xl w-[98vw] max-h-[98vh] h-[95vh] flex flex-col overflow-hidden bg-gray-50">
        <DialogHeader className="bg-green-600 text-white p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Chat Unifié</h3>
                <p className="text-xs text-green-100">
                  {correspondanceData?.subject || 'Correspondance'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-500 rounded-full transition-colors"
              title="Fermer le chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </DialogTitle>
          <DialogDescription className="text-green-100 text-sm">
            💬 Communication centralisée entre DG et Directeur
            {autoCloseOnMessage && (
              <span className="text-xs text-green-200 ml-2">
                • Fermeture automatique après envoi
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Chat unifié sans onglets */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Indicateur de statut style WhatsApp */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 flex-1">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-500 border-t-transparent"></div>
                    <span className="text-xs text-yellow-600 font-medium">Connexion en cours...</span>
                  </>
                ) : workflowId ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">🟢 En ligne</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-600 font-medium">🔴 Déconnecté</span>
                  </>
                )}
              </div>
              
              <div className="text-xs text-gray-400">
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
                      
                      // Fermer automatiquement le dialogue si l'option est activée
                      if (autoCloseOnMessage) {
                        console.log('🔒 [UnifiedChat] Fermeture automatique du dialogue après envoi');
                        setTimeout(() => {
                          onClose();
                        }, 1000); // Délai de 1 seconde pour laisser voir le message envoyé
                      }
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

        {/* Message d'information style WhatsApp */}
        <div className="mt-3 p-3 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">💬 Communication unifiée DG ↔ Directeur</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Toutes les conversations sont chiffrées et sécurisées
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedChatDialog;
