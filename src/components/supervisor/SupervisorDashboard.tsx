import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  TrendingUp,
  Users,
  Bell,
  ArrowRight,
  Zap,
  Timer
} from 'lucide-react';
import { useSupervisorDashboard } from '@/hooks/useSupervisorDashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepareResponseDialog } from './PrepareResponseDialog';
import { FinalizeResponseDialog } from './FinalizeResponseDialog';
import { CorrespondanceDetailsDialog } from '../correspondances/CorrespondanceDetailsDialog';
import { ValidatedCorrespondance } from '@/hooks/useSupervisorDashboard';
import { SupervisorDashboardSkeleton } from './SupervisorDashboardSkeleton';

export const SupervisorDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useSupervisorDashboard();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [selectedCorrespondance, setSelectedCorrespondance] = useState<ValidatedCorrespondance | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCorrespondanceId, setSelectedCorrespondanceId] = useState<string | null>(null);

  // Utilisation des données réelles du dashboard
  const deadlineAlerts = dashboardData?.criticalDeadlines || [];
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];
  const overdueItems = dashboardData?.overdueItems || [];
  const validatedCorrespondances = dashboardData?.validatedForResponse || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-blue-500 text-white';
      case 'LOW': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatTimeRemaining = (days: number, hours: number) => {
    // Convertir les heures en jours si nécessaire
    const totalHours = hours;
    const additionalDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const totalDays = days + additionalDays;
    
    if (totalDays > 0) {
      if (remainingHours > 0) {
        return `${totalDays}j ${remainingHours}h`;
      }
      return `${totalDays}j`;
    }
    
    if (remainingHours > 0) {
      return `${remainingHours}h`;
    }
    
    return "Expiré";
  };

  const handleFinalizeResponse = (correspondance: ValidatedCorrespondance) => {
    setSelectedCorrespondance(correspondance);
    setIsFinalizeDialogOpen(true);
  };

  const handleViewDetails = (correspondanceId: string) => {
    setSelectedCorrespondanceId(correspondanceId);
    setIsDetailsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedCorrespondance(null);
    setSelectedCorrespondanceId(null);
    setIsResponseDialogOpen(false);
    setIsFinalizeDialogOpen(false);
    setIsDetailsDialogOpen(false);
  };

  const handleSuccess = () => {
    // Rafraîchir les données du dashboard
    window.location.reload(); // Simple refresh pour l'instant
  };

  if (isLoading) {
    return <SupervisorDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Superviseur Bureau d'Ordre
          </h1>
          <p className="text-gray-600 mt-1">
            Supervision des correspondances et gestion des échéances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedTimeframe === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('today')}
          >
            Aujourd'hui
          </Button>
          <Button
            variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('week')}
          >
            Cette semaine
          </Button>
          <Button
            variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('month')}
          >
            Ce mois
          </Button>
        </div>
      </div>

      {/* Statistiques Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Correspondances
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {dashboardData?.totalCorrespondances || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {(dashboardData?.totalCorrespondances || 0) > 0 ? 'Données en temps réel' : 'Aucune donnée'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Échéances Critiques
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {deadlineAlerts.length + overdueItems.length}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Nécessitent une action immédiate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Validées pour Réponse
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {validatedCorrespondances.length}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Prêtes pour préparation réponse
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Taux de Réponse
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {dashboardData?.responseRate || 0}%
            </div>
            <Progress value={dashboardData?.responseRate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Alertes Échéances - Version modernisée */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-orange-800">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Alertes Échéances</h3>
                <p className="text-sm text-orange-600 font-normal">Correspondances prioritaires</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {deadlineAlerts.length + overdueItems.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Alertes critiques */}
            {deadlineAlerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{alert.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📍 {alert.airport}
                        </span>
                        <span className="text-xs text-gray-500">
                          ⏰ {format(new Date(alert.deadline), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Badge className={getPriorityColor(alert.priority)} variant="secondary">
                      {alert.priority}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-600">
                        {formatTimeRemaining(alert.daysRemaining, alert.hoursRemaining)}
                      </div>
                      <div className="text-xs text-gray-500">restantes</div>
                    </div>
                    <Button size="sm" variant="outline" className="hover:bg-red-50 hover:border-red-300">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Correspondances en retard */}
            {overdueItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-red-300 shadow-sm hover:shadow-md transition-all duration-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{item.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📍 {item.airport}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ⚠️ Retard: {item.daysOverdue} jour{item.daysOverdue > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Badge className={getPriorityColor(item.priority)} variant="secondary">
                      {item.priority}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-700">
                        +{item.daysOverdue}j
                      </div>
                      <div className="text-xs text-gray-500">en retard</div>
                    </div>
                    <Button size="sm" variant="outline" className="hover:bg-red-50 hover:border-red-300">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Échéances à venir */}
            {upcomingDeadlines.slice(0, 3).map((alert) => (
              <Alert key={alert.id} className="bg-orange-100 border-orange-500 text-orange-800 border-l-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm opacity-80">
                        Aéroport: {alert.airport} • Échéance: {format(new Date(alert.deadline), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(alert.priority)}>
                      {alert.priority}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatTimeRemaining(alert.daysRemaining, alert.hoursRemaining)}
                      </div>
                      <div className="text-xs opacity-70">restantes</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}

            {deadlineAlerts.length === 0 && overdueItems.length === 0 && upcomingDeadlines.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tout est à jour !</h3>
                <p className="text-gray-500 text-sm">Aucune alerte d'échéance pour le moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Correspondances Validées pour Réponse */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="w-5 h-5 mr-2" />
            Correspondances Validées - Prêtes pour Réponse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validatedCorrespondances.map((corresp) => (
              <div key={corresp.id} className="bg-white rounded-lg border border-green-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{corresp.title}</h3>
                      <p className="text-sm text-gray-600">{corresp.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(corresp.priority)}>
                      {corresp.priority}
                    </Badge>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {corresp.airport}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-md p-3 mb-3">
                  <div className="flex items-center text-sm text-green-800 mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    Validé par: {corresp.validatedBy}
                  </div>
                  <div className="text-sm text-green-700">
                    <strong>Commentaires:</strong> {corresp.directorComments}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Timer className="w-4 h-4 mr-1" />
                    Validé le {corresp.validatedAt ? format(new Date(corresp.validatedAt), 'dd/MM à HH:mm', { locale: fr }) : 'Date inconnue'}
                    {corresp.deadline && (
                      <span> • Échéance: {format(new Date(corresp.deadline), 'dd/MM HH:mm', { locale: fr })}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(corresp.correspondanceId)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir détails
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => handleFinalizeResponse(corresp)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Finaliser réponse
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {validatedCorrespondances.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune correspondance validée en attente de réponse</p>
                <p className="text-sm mt-2">Les correspondances validées par le directeur apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graphiques et Statistiques Détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.priorityBreakdown ? [
                { priority: 'URGENT', count: dashboardData.priorityBreakdown.URGENT, color: 'bg-red-500' },
                { priority: 'HIGH', count: dashboardData.priorityBreakdown.HIGH, color: 'bg-orange-500' },
                { priority: 'MEDIUM', count: dashboardData.priorityBreakdown.MEDIUM, color: 'bg-blue-500' },
                { priority: 'LOW', count: dashboardData.priorityBreakdown.LOW, color: 'bg-gray-500' }
              ].map((item) => {
                const total = dashboardData.totalCorrespondances || 1;
                return (
                  <div key={item.priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium">{item.priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${(item.count / total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8">{item.count}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Aucune donnée de priorité disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance par Aéroport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.airportStats && dashboardData.airportStats.length > 0 ? 
                dashboardData.airportStats.map((item) => (
                  <div key={item.airport} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.airport}</span>
                      <span>{item.responded}/{item.total} ({item.responseRate}%)</span>
                    </div>
                    <Progress value={item.responseRate} className="h-2" />
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Aucune donnée par aéroport disponible</p>
                  </div>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de préparation de réponse */}
      <PrepareResponseDialog
        correspondance={selectedCorrespondance}
        open={isResponseDialogOpen}
        onOpenChange={setIsResponseDialogOpen}
      />

      {/* Dialog de finalisation de réponse */}
      {selectedCorrespondance && (
        <FinalizeResponseDialog
          correspondanceId={selectedCorrespondance.correspondanceId}
          correspondanceData={selectedCorrespondance}
          isOpen={isFinalizeDialogOpen}
          onClose={handleDialogClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* Dialog de détails de correspondance */}
      {selectedCorrespondanceId && (
        <CorrespondanceDetailsDialog
          correspondanceId={selectedCorrespondanceId}
          isOpen={isDetailsDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </div>
  );
};
