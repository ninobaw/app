import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export interface SupportedLanguages {
  [key: string]: string;
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  originalText?: string;
  fallback?: boolean;
  message?: string;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  user?: {
    name: string;
    email: string;
  };
  error?: string;
}

export const useTranslation = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Récupérer les langues supportées
  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages 
  } = useQuery({
    queryKey: ['translation-languages'],
    queryFn: async () => {
      const response = await api.get('/api/translation/languages');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Vérifier le statut de connexion
  const { 
    data: connectionStatus, 
    isLoading: isCheckingConnection,
    refetch: refetchConnectionStatus 
  } = useQuery({
    queryKey: ['translation-status'],
    queryFn: async () => {
      const response = await api.get('/api/translation/status');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation pour la traduction
  const translateMutation = useMutation({
    mutationFn: async ({ 
      text, 
      targetLanguage, 
      sourceLanguage = 'auto' 
    }: {
      text: string;
      targetLanguage: string;
      sourceLanguage?: string;
    }) => {
      const response = await api.post('/api/translation/translate', {
        text,
        targetLanguage,
        sourceLanguage
      });
      return response.data;
    },
    onSuccess: (data: TranslationResult) => {
      if (data.fallback) {
        toast({
          title: 'Traduction basique',
          description: data.message || 'Service Copilot indisponible, traduction basique utilisée',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Traduction réussie',
          description: 'Texte traduit avec Microsoft Copilot',
          variant: 'default',
        });
      }
    },
    onError: (error: any) => {
      console.error('Erreur traduction:', error);
      toast({
        title: 'Erreur de traduction',
        description: error.response?.data?.message || 'Impossible de traduire le texte',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour la détection de langue
  const detectLanguageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post('/api/translation/detect-language', { text });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Erreur détection langue:', error);
    },
  });

  // Fonction pour initier la connexion Office 365
  const connectToCopilot = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Récupérer l'URL d'authentification
      const response = await api.get('/api/translation/auth-url');
      const { authUrl } = response.data;
      
      // Ouvrir une popup pour l'authentification
      const popup = window.open(
        authUrl,
        'copilot-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Écouter les messages de la popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'COPILOT_AUTH_SUCCESS') {
          popup?.close();
          
          // Traiter le code d'autorisation
          api.post('/api/translation/auth-callback', {
            code: event.data.code
          }).then(() => {
            toast({
              title: 'Connexion réussie',
              description: 'Vous êtes maintenant connecté à Microsoft Copilot',
              variant: 'default',
            });
            refetchConnectionStatus();
          }).catch((error) => {
            toast({
              title: 'Erreur de connexion',
              description: error.response?.data?.message || 'Échec de la connexion',
              variant: 'destructive',
            });
          });
          
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'COPILOT_AUTH_ERROR') {
          popup?.close();
          toast({
            title: 'Erreur d\'authentification',
            description: event.data.error || 'Échec de l\'authentification',
            variant: 'destructive',
          });
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Nettoyer si la popup est fermée manuellement
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Erreur connexion Copilot:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'initier la connexion',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, refetchConnectionStatus]);

  // Fonction pour se déconnecter
  const disconnectFromCopilot = useCallback(async () => {
    try {
      await api.post('/api/translation/disconnect');
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous êtes maintenant déconnecté de Microsoft Copilot',
        variant: 'default',
      });
      refetchConnectionStatus();
    } catch (error: any) {
      console.error('Erreur déconnexion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
        variant: 'destructive',
      });
    }
  }, [toast, refetchConnectionStatus]);

  // Fonction de traduction simplifiée
  const translateText = useCallback(
    (text: string, targetLanguage: string, sourceLanguage = 'auto') => {
      return translateMutation.mutateAsync({ text, targetLanguage, sourceLanguage });
    },
    [translateMutation]
  );

  // Fonction de détection de langue simplifiée
  const detectLanguage = useCallback(
    (text: string) => {
      return detectLanguageMutation.mutateAsync(text);
    },
    [detectLanguageMutation]
  );

  return {
    // Données
    languages: languagesData?.languages as SupportedLanguages || {},
    isConfigured: languagesData?.configured || false,
    connectionStatus: connectionStatus as ConnectionStatus,
    
    // États de chargement
    isLoadingLanguages,
    isCheckingConnection,
    isConnecting,
    isTranslating: translateMutation.isPending,
    isDetectingLanguage: detectLanguageMutation.isPending,
    
    // Fonctions
    connectToCopilot,
    disconnectFromCopilot,
    translateText,
    detectLanguage,
    refetchConnectionStatus,
    
    // Résultats des mutations
    translationResult: translateMutation.data as TranslationResult,
    detectionResult: detectLanguageMutation.data,
    
    // Erreurs
    translationError: translateMutation.error,
    detectionError: detectLanguageMutation.error,
  };
};
