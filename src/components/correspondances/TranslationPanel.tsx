import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Languages, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe,
  ArrowRightLeft,
  Sparkles,
  Link,
  User,
  LogOut
} from 'lucide-react';
import { useTranslation as useTranslationHook } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';

interface TranslationPanelProps {
  sourceText: string;
  onTranslatedTextChange: (translatedText: string, targetLanguage: string) => void;
  className?: string;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  sourceText,
  onTranslatedTextChange,
  className = ''
}) => {
  const { toast } = useToast();
  const {
    languages,
    isConfigured,
    connectionStatus,
    isCheckingConnection,
    isConnecting,
    isTranslating,
    connectToCopilot,
    disconnectFromCopilot,
    translateText,
    detectLanguage,
    translationResult
  } = useTranslationHook();

  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [autoDetectedLanguage, setAutoDetectedLanguage] = useState<string>('');

  // Auto-détecter la langue du texte source quand il change (avec debounce)
  useEffect(() => {
    if (sourceText && sourceText.length > 10 && sourceLanguage === 'auto') {
      // Debounce de 1 seconde pour éviter les appels répétés
      const timeoutId = setTimeout(() => {
        console.log('🔍 [TranslationPanel] Détection langue pour:', sourceText.substring(0, 50));
        detectLanguage(sourceText).then((result: any) => {
          if (result?.language) {
            console.log('✅ [TranslationPanel] Langue détectée:', result.language);
            setAutoDetectedLanguage(result.language);
          }
        }).catch((error) => {
          console.error('❌ [TranslationPanel] Erreur détection langue:', error);
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [sourceText, sourceLanguage]); // Retiré detectLanguage des dépendances

  // Fonction de traduction
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: 'Texte manquant',
        description: 'Veuillez saisir un texte à traduire',
        variant: 'destructive',
      });
      return;
    }

    if (!connectionStatus?.connected) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter à Microsoft Copilot pour utiliser la traduction',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await translateText(sourceText, targetLanguage, sourceLanguage);
      if (result.success && result.translatedText) {
        setTranslatedText(result.translatedText);
        onTranslatedTextChange(result.translatedText, targetLanguage);
      }
    } catch (error) {
      console.error('Erreur traduction:', error);
    }
  };

  // Copier le texte traduit
  const copyTranslatedText = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      toast({
        title: 'Copié !',
        description: 'Texte traduit copié dans le presse-papiers',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le texte',
        variant: 'destructive',
      });
    }
  };

  // Utiliser la traduction dans le formulaire
  const useTranslation = () => {
    if (translatedText) {
      onTranslatedTextChange(translatedText, targetLanguage);
      toast({
        title: 'Traduction appliquée',
        description: 'Le texte traduit a été appliqué au formulaire',
        variant: 'default',
      });
    }
  };

  // Inverser les langues
  const swapLanguages = () => {
    if (sourceLanguage !== 'auto' && targetLanguage !== sourceLanguage) {
      const newSource = targetLanguage;
      const newTarget = sourceLanguage;
      setSourceLanguage(newSource);
      setTargetLanguage(newTarget);
      
      // Si on a une traduction, l'inverser aussi
      if (translatedText) {
        setTranslatedText(sourceText);
        onTranslatedTextChange(sourceText, newTarget);
      }
    }
  };

  if (!isConfigured) {
    return (
      <Card className={`border-orange-200 bg-orange-50 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Service de Traduction Non Configuré
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 text-sm">
            Le service de traduction Microsoft Copilot n'est pas configuré. 
            Contactez votre administrateur pour activer cette fonctionnalité.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <span>Traduction Microsoft Copilot</span>
          </div>
          
          {/* Statut de connexion */}
          <div className="flex items-center gap-2">
            {isCheckingConnection ? (
              <Badge variant="secondary" className="animate-pulse">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Vérification...
              </Badge>
            ) : connectionStatus?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Déconnecté
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations utilisateur connecté */}
        {connectionStatus?.connected && connectionStatus.user && (
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm text-green-800">
                    {connectionStatus.user.name}
                  </div>
                  <div className="text-xs text-green-600">
                    {connectionStatus.user.email}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectFromCopilot}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Déconnecter
              </Button>
            </div>
          </div>
        )}

        {/* Bouton de connexion */}
        {!connectionStatus?.connected && (
          <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
            <div className="mb-3">
              <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-blue-800">Connectez-vous à Microsoft Copilot</h4>
              <p className="text-sm text-blue-600 mt-1">
                Utilisez votre compte Office 365 pour accéder à la traduction intelligente
              </p>
            </div>
            <Button 
              onClick={connectToCopilot}
              disabled={isConnecting}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Se connecter à Office 365
                </>
              )}
            </Button>
          </div>
        )}

        {/* Interface de traduction */}
        {connectionStatus?.connected && (
          <>
            {/* Sélection des langues */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Langue source
                </label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Détection automatique
                      </div>
                    </SelectItem>
                    {Object.entries(languages || {}).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {String(name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {autoDetectedLanguage && sourceLanguage === 'auto' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Détectée: {(languages && languages[autoDetectedLanguage]) || autoDetectedLanguage}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={swapLanguages}
                  disabled={sourceLanguage === 'auto'}
                  className="w-10 h-10 p-0"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Langue cible
                </label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languages || {}).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {String(name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Texte source */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Texte à traduire
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {sourceText || 'Aucun texte à traduire...'}
                </p>
              </div>
              {sourceText && (
                <p className="text-xs text-gray-500 mt-1">
                  {sourceText.length} caractères
                </p>
              )}
            </div>

            {/* Bouton de traduction */}
            <div className="flex justify-center">
              <Button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isTranslating}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Traduction en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Traduire avec Copilot
                  </>
                )}
              </Button>
            </div>

            {/* Résultat de la traduction */}
            {translatedText && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Texte traduit
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyTranslatedText}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copier
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={useTranslation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={translatedText}
                    onChange={(e) => setTranslatedText(e.target.value)}
                    className="min-h-[100px] bg-green-50 border-green-200"
                    placeholder="La traduction apparaîtra ici..."
                  />
                  {translationResult?.fallback && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Traduction basique utilisée (Copilot indisponible)
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
