import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFixAssignments, useFixObjectIdReferences } from '@/hooks/useCorrespondanceWorkflow';
import { ProposalsDebugPanel } from './ProposalsDebugPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CorrespondanceAssignmentFixer: React.FC = () => {
  const { user } = useAuth();
  const fixAssignments = useFixAssignments();
  const fixObjectIdReferences = useFixObjectIdReferences();

  // Vérifier les permissions
  const canFixAssignments = user?.role && ['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role);

  if (!canFixAssignments) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Accès refusé. Cette fonctionnalité est réservée aux administrateurs et au Directeur Général.
        </AlertDescription>
      </Alert>
    );
  }

  const handleFixAssignments = () => {
    if (confirm('Êtes-vous sûr de vouloir corriger les assignations des correspondances ? Cette action va assigner automatiquement toutes les correspondances non assignées aux directeurs appropriés.')) {
      fixAssignments.mutate();
    }
  };

  const handleFixObjectIdReferences = () => {
    if (confirm('Êtes-vous sûr de vouloir corriger les références ObjectId ? Cette action va nettoyer les références invalides dans la base de données.')) {
      fixObjectIdReferences.mutate();
    }
  };

  return (
    <div className="space-y-6">
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Correction des Assignations
        </CardTitle>
        <CardDescription>
          Corriger automatiquement les assignations des correspondances aux directeurs appropriés
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Que fait cette fonction ?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Trouve toutes les correspondances non assignées</li>
            <li>• Analyse le contenu pour déterminer le domaine approprié</li>
            <li>• Assigne automatiquement aux directeurs concernés</li>
            <li>• Met à jour le statut du workflow</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-medium text-amber-900 mb-2">Critères d'assignation automatique</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-amber-800">
            <div>
              <strong>Technique :</strong> maintenance, équipement, sécurité, infrastructure
            </div>
            <div>
              <strong>Commercial :</strong> compagnie, vol, passager, contrat, marketing
            </div>
            <div>
              <strong>Financier :</strong> budget, coût, facture, comptabilité, investissement
            </div>
            <div>
              <strong>Opérations :</strong> exploitation, planning, logistique, transport
            </div>
            <div>
              <strong>RH :</strong> personnel, recrutement, formation, salaire
            </div>
            <div>
              <strong>Urgences :</strong> Assignées au DG + tous les directeurs
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900 mb-2">Correction des références ObjectId</h4>
          <p className="text-sm text-red-800 mb-3">
            Corrige les erreurs de type "Cast to ObjectId failed" en nettoyant les références invalides.
          </p>
          <Button
            onClick={handleFixObjectIdReferences}
            disabled={fixObjectIdReferences.isPending}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-100"
          >
            {fixObjectIdReferences.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            {fixObjectIdReferences.isPending ? 'Correction en cours...' : 'Corriger les références ObjectId'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
            <Badge variant="outline">
              Réversible
            </Badge>
          </div>
          
          <Button
            onClick={handleFixAssignments}
            disabled={fixAssignments.isPending}
            className="flex items-center space-x-2"
          >
            {fixAssignments.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            <span>
              {fixAssignments.isPending ? 'Correction en cours...' : 'Corriger les assignations'}
            </span>
          </Button>
        </div>

        {fixAssignments.isSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Correction terminée avec succès ! Les correspondances ont été assignées aux directeurs appropriés.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* Panneau de diagnostic des propositions */}
    <ProposalsDebugPanel />
  </div>
  );
};
