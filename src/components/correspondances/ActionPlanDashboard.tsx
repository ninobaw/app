import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Calendar,
  Target,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { formatDate } from '@/shared/utils';

interface ActionPlanDashboardProps {
  correspondanceId?: string;
}

export const ActionPlanDashboard: React.FC<ActionPlanDashboardProps> = ({
  correspondanceId
}) => {
  const { correspondances, isLoading } = useCorrespondances();
  
  // Filtrer les correspondances avec des actions décidées
  const correspondancesWithActions = correspondances?.filter(c => 
    c.actions_decidees && c.actions_decidees.length > 0 &&
    (!correspondanceId || c.id === correspondanceId)
  ) || [];

  // Calculer les statistiques globales
  const totalActions = correspondancesWithActions.reduce((sum, c) => 
    sum + (c.actions_decidees?.length || 0), 0
  );
  
  const completedActions = correspondancesWithActions.reduce((sum, c) => 
    sum + (c.actions_decidees?.filter((a: any) => a.statut === 'COMPLETED').length || 0), 0
  );
  
  const inProgressActions = correspondancesWithActions.reduce((sum, c) => 
    sum + (c.actions_decidees?.filter((a: any) => a.statut === 'IN_PROGRESS').length || 0), 0
  );

  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Actions en retard (échéance dépassée)
  const overdueActions = correspondancesWithActions.reduce((sum, c) => {
    const overdue = c.actions_decidees?.filter((a: any) => {
      if (a.statut === 'COMPLETED') return false;
      const dueDate = new Date(a.echeance);
      return dueDate < new Date();
    }).length || 0;
    return sum + overdue;
  }, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{totalActions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{completedActions}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressActions}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-red-600">{overdueActions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taux de completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progression Globale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taux de completion</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{completedActions} terminées</span>
              <span>{totalActions} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des correspondances avec actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Plans d'Action par Correspondance
        </h3>
        
        {correspondancesWithActions.map((correspondance) => {
          const actions = correspondance.actions_decidees || [];
          const completed = actions.filter((a: any) => a.statut === 'COMPLETED').length;
          const progress = actions.length > 0 ? Math.round((completed / actions.length) * 100) : 0;
          const hasSharedPlan = actions.some((a: any) => a.personnesConcernees && a.personnesConcernees.length > 0);
          
          return (
            <Card key={correspondance.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{correspondance.subject}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>De: {correspondance.from_address}</span>
                      <span>À: {correspondance.to_address}</span>
                      <Badge variant="secondary">
                        {correspondance.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{progress}% terminé</div>
                    <div className="text-xs text-gray-500">{completed}/{actions.length} actions</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Barre de progression */}
                  <Progress value={progress} className="h-2" />
                  
                  {/* Indicateur plan partagé */}
                  {hasSharedPlan && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Users className="w-4 h-4" />
                      <span>Plan partagé aux responsables</span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    {actions.map((action: any, index: number) => {
                      const isOverdue = action.statut !== 'COMPLETED' && new Date(action.echeance) < new Date();
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{action.titre}</span>
                              <Badge 
                                variant={action.statut === 'COMPLETED' ? 'default' : 'secondary'}
                                className={
                                  action.statut === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  action.statut === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {action.statut}
                              </Badge>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  En retard
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(action.echeance)}
                              </span>
                              {action.responsable && action.responsable.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {action.responsable.length} responsable(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {correspondancesWithActions.length === 0 && (
          <Card className="text-center p-8">
            <CardContent>
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun plan d'action trouvé
              </h3>
              <p className="text-gray-500">
                Les correspondances avec des actions décidées apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
