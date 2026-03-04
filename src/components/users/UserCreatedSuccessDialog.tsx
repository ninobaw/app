import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Mail, 
  Key, 
  User, 
  MapPin, 
  Copy, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Info,
  Sparkles,
  Shield,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserCreatedSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  welcomeData: {
    success: boolean;
    message: string;
    userInfo: {
      name: string;
      email: string;
      role: string;
      airport: string;
      temporaryPassword: string;
      serverUrl?: string;
    };
    instructions: string[];
  };
  emailSent: boolean;
  emailError?: string | null;
}

export const UserCreatedSuccessDialog: React.FC<UserCreatedSuccessDialogProps> = ({
  isOpen,
  onClose,
  welcomeData,
  emailSent,
  emailError
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copié !",
        description: `${fieldName} copié dans le presse-papiers`,
        variant: "default",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier dans le presse-papiers",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Super Administrateur': 'bg-purple-100 text-purple-800 border-purple-200',
      'Administrateur': 'bg-blue-100 text-blue-800 border-blue-200',
      'Directeur Général': 'bg-red-100 text-red-800 border-red-200',
      'Directeur': 'bg-orange-100 text-orange-800 border-orange-200',
      'Sous-Directeur': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Agent Bureau d\'Ordre': 'bg-green-100 text-green-800 border-green-200',
      'Superviseur Bureau d\'Ordre': 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getAirportIcon = (airport: string) => {
    switch (airport) {
      case 'ENFIDHA': return '✈️';
      case 'MONASTIR': return '🛫';
      case 'GENERALE': return '🏢';
      default: return '📍';
    }
  };

  if (!welcomeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Utilisateur Créé avec Succès dans SGDO !
              </div>
              <div className="text-sm text-gray-500 font-normal">
                Compte activé et prêt à être utilisé
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations utilisateur */}
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-green-600" />
                Informations du Nouvel Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Nom complet :</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    {welcomeData.userInfo.name}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Email :</span>
                  </div>
                  <div className="text-lg font-mono text-blue-600">
                    {welcomeData.userInfo.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <span className="font-medium">Rôle :</span>
                  <div>
                    <Badge className={`${getRoleBadgeColor(welcomeData.userInfo.role)} border text-sm px-3 py-1`}>
                      {welcomeData.userInfo.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Aéroport :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getAirportIcon(welcomeData.userInfo.airport)}</span>
                    <span className="font-semibold">{welcomeData.userInfo.airport}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identifiants de connexion */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-blue-600" />
                Identifiants de Connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email/Login */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Email / Login</span>
                    </div>
                    <div className="font-mono text-lg text-blue-600 bg-blue-50 px-3 py-2 rounded border">
                      {welcomeData.userInfo.email}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(welcomeData.userInfo.email, 'Email')}
                    className="ml-3"
                  >
                    {copiedField === 'Email' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Mot de passe temporaire */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Mot de passe temporaire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-lg text-red-600 bg-red-50 px-3 py-2 rounded border flex-1">
                        {showPassword ? welcomeData.userInfo.temporaryPassword : '••••••••••••'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(welcomeData.userInfo.temporaryPassword, 'Mot de passe')}
                    className="ml-3"
                  >
                    {copiedField === 'Mot de passe' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Avertissement */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-800 mb-1">Important !</div>
                    <div className="text-amber-700 text-sm">
                      Ce mot de passe est temporaire et doit être changé lors de la première connexion.
                      L'utilisateur sera automatiquement invité à créer un nouveau mot de passe sécurisé.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lien d'accès au serveur */}
          {welcomeData.userInfo.serverUrl && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🚀</span>
                  </div>
                  Accéder à SGDO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">Lien d'accès direct</span>
                      </div>
                      <div className="font-mono text-lg text-indigo-600 bg-indigo-50 px-3 py-2 rounded border">
                        {welcomeData.userInfo.serverUrl}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(welcomeData.userInfo.serverUrl!, 'Lien SGDO')}
                      >
                        {copiedField === 'Lien SGDO' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(welcomeData.userInfo.serverUrl, '_blank')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-indigo-700">
                  💡 L'utilisateur peut cliquer sur ce lien dans son email pour accéder directement à SGDO
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statut de l'email */}
          <Card className={`border-2 ${emailSent ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className={`w-5 h-5 ${emailSent ? 'text-green-600' : 'text-orange-600'}`} />
                Notification Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-green-800 mb-1">Email envoyé avec succès !</div>
                    <div className="text-green-700 text-sm">
                      Un email de bienvenue détaillé avec les identifiants et instructions a été envoyé à{' '}
                      <span className="font-mono font-semibold">{welcomeData.userInfo.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-orange-800 mb-1">Échec de l'envoi de l'email</div>
                    <div className="text-orange-700 text-sm mb-2">
                      L'email de bienvenue n'a pas pu être envoyé automatiquement.
                    </div>
                    {emailError && (
                      <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded border">
                        Erreur : {emailError}
                      </div>
                    )}
                    <div className="text-orange-700 text-sm mt-2">
                      Veuillez communiquer manuellement les identifiants à l'utilisateur.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-purple-600" />
                Instructions pour l'Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {welcomeData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="text-gray-700">{instruction}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conseils de sécurité */}
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-gray-600" />
                Conseils de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Mot de passe fort requis (8+ caractères)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Ne jamais partager ses identifiants</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Toujours se déconnecter après usage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Signaler tout problème de sécurité</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-end space-x-3">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Parfait !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
