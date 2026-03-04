import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ImportProgressState {
  isImporting: boolean;
  progress: number;
  current: number;
  total: number;
  phase: 'preparing' | 'uploading' | 'processing' | 'finalizing' | 'complete' | 'error';
  message: string;
}

export const useImportProgress = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ImportProgressState>({
    isImporting: false,
    progress: 0,
    current: 0,
    total: 0,
    phase: 'preparing',
    message: ''
  });

  const progressToastId = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const startImport = useCallback((total: number) => {
    setState({
      isImporting: true,
      progress: 0,
      current: 0,
      total,
      phase: 'preparing',
      message: 'Préparation de l\'importation...'
    });

    // Afficher la notification de progression avec jauge
    progressToastId.current = toast({
      title: '🚗 Importation en cours',
      description: 'Préparation de l\'importation...',
      duration: 0, // Infini
    });

    // Simuler la progression
    let currentProgress = 0;
    let currentPhase: ImportProgressState['phase'] = 'preparing';
    let currentMessage = 'Préparation de l\'importation...';

    progressInterval.current = setInterval(() => {
      // Phases de progression
      if (currentProgress < 20) {
        currentPhase = 'preparing';
        currentMessage = 'Préparation des données...';
        currentProgress += Math.random() * 3;
      } else if (currentProgress < 40) {
        currentPhase = 'uploading';
        currentMessage = 'Téléchargement des fichiers...';
        currentProgress += Math.random() * 2;
      } else if (currentProgress < 80) {
        currentPhase = 'processing';
        currentMessage = 'Traitement des correspondances...';
        currentProgress += Math.random() * 1.5;
      } else if (currentProgress < 95) {
        currentPhase = 'finalizing';
        currentMessage = 'Finalisation...';
        currentProgress += Math.random() * 1;
      }

      setState(prev => ({
        ...prev,
        progress: Math.min(currentProgress, 95),
        current: Math.floor((currentProgress / 100) * total),
        phase: currentPhase,
        message: currentMessage
      }));
    }, 200);
  }, [toast]);

  const completeImport = useCallback((successCount: number, errorCount: number) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    setState(prev => ({
      ...prev,
      isImporting: false,
      progress: 100,
      current: successCount,
      phase: 'complete',
      message: 'Importation terminée !'
    }));

    // Fermer la notification de progression
    if (progressToastId.current?.dismiss) {
      progressToastId.current.dismiss();
    }

    // Afficher la notification de succès
    setTimeout(() => {
      const totalCount = successCount + errorCount;
      const successRate = Math.round((successCount / totalCount) * 100);
      
      toast({
        title: '🎉 Importation terminée !',
        description: `${successCount} correspondances créées avec succès (${successRate}% de réussite)`,
        variant: errorCount > 0 ? 'destructive' : 'default',
        duration: 6000,
      });
    }, 500);
  }, [toast]);

  const errorImport = useCallback((error: string) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    setState(prev => ({
      ...prev,
      isImporting: false,
      phase: 'error',
      message: 'Erreur lors de l\'importation'
    }));

    // Fermer la notification de progression
    if (progressToastId.current?.dismiss) {
      progressToastId.current.dismiss();
    }

    // Afficher la notification d'erreur
    setTimeout(() => {
      toast({
        title: '❌ Erreur d\'importation',
        description: error,
        variant: 'destructive',
        duration: 8000,
      });
    }, 500);
  }, [toast]);

  const resetImport = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    if (progressToastId.current?.dismiss) {
      progressToastId.current.dismiss();
    }

    setState({
      isImporting: false,
      progress: 0,
      current: 0,
      total: 0,
      phase: 'preparing',
      message: ''
    });
  }, []);

  return {
    ...state,
    startImport,
    completeImport,
    errorImport,
    resetImport
  };
};
