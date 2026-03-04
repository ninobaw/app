import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Globe,
  Building,
  Crown,
  Activity,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectorGeneralDashboard } from '@/hooks/useDirectorGeneralDashboard';
import { DGResponseReviewPanel } from './DGResponseReviewPanel';

interface DirectorGeneralMetrics {
  // Vue d'ensemble stratégique
  totalCorrespondances: number;
  correspondancesThisMonth: number;
  monthlyGrowth: number;
  
  // Workflow de traitement
  pendingApproval: number;
  awaitingResponse: number;
  completedThisWeek: number;
  overdueItems: number;
  
  // Performance organisationnelle
  averageResponseTime: number;
  responseRate: number;
  departmentPerformance: Array<{
    department: string;
    total: number;
    completed: number;
    responseRate: number;
    avgTime: number;
  }>;
  
  // Alertes stratégiques
  criticalCorrespondances: Array<{
    id: string;
    subject: string;
    from: string;
    priority: string;
    daysOverdue: number;
    assignedTo: string;
  }>;
  
  // Tendances et analyses
  weeklyTrends: Array<{
    week: string;
    incoming: number;
    processed: number;
    pending: number;
  }>;
  
  // Répartition par type et priorité
  typeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}

export const DirectorGeneralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'workflow' | 'performance' | 'review'>('overview');
  
  // Utiliser les données réelles du hook
  const { data: metrics, isLoading, error } = useDirectorGeneralDashboard(selectedPeriod);

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Afficher une erreur si les données ne se chargent pas
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600">Impossible de charger les données du dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  // Utiliser des valeurs par défaut si les données ne sont pas encore disponibles
  const dashboardMetrics = metrics || {
    totalCorrespondances: 1247,
    correspondancesThisMonth: 89,
    monthlyGrowth: 12.5,
    pendingApproval: 23,
    awaitingResponse: 45,
    completedThisWeek: 67,
    overdueItems: 8,
    averageResponseTime: 2.3,
    responseRate: 87.5,
    departmentPerformance: [
      { department: 'Technique', total: 45, completed: 38, responseRate: 84.4, avgTime: 2.1 },
      { department: 'Commercial', total: 32, completed: 29, responseRate: 90.6, avgTime: 1.8 },
      { department: 'Financier', total: 28, completed: 24, responseRate: 85.7, avgTime: 2.5 },
      { department: 'Opérations', total: 52, completed: 46, responseRate: 88.5, avgTime: 2.0 },
      { department: 'RH', total: 19, completed: 17, responseRate: 89.5, avgTime: 1.9 }
    ],
    criticalCorrespondances: [
      { id: '1', subject: 'Audit sécurité aéroportuaire urgent', from: 'DGAC', priority: 'URGENT', daysOverdue: 3, assignedTo: 'Dir. Technique' },
      { id: '2', subject: 'Négociation contrat compagnie aérienne', from: 'Air France', priority: 'HIGH', daysOverdue: 1, assignedTo: 'Dir. Commercial' },
      { id: '3', subject: 'Budget investissements 2025', from: 'Ministère Transport', priority: 'HIGH', daysOverdue: 2, assignedTo: 'Dir. Financier' }
    ],
    weeklyTrends: [
      { week: 'S40', incoming: 45, processed: 42, pending: 3 },
      { week: 'S41', incoming: 52, processed: 48, pending: 7 },
      { week: 'S42', incoming: 38, processed: 41, pending: 4 },
      { week: 'S43', incoming: 47, processed: 44, pending: 6 }
    ],
    typeDistribution: [
      { type: 'Réglementaire', count: 45, percentage: 36 },
      { type: 'Commercial', count: 32, percentage: 26 },
      { type: 'Technique', count: 28, percentage: 22 },
      { type: 'Administratif', count: 20, percentage: 16 }
    ],
    priorityDistribution: [
      { priority: 'URGENT', count: 12, percentage: 9.6 },
      { priority: 'HIGH', count: 34, percentage: 27.2 },
      { priority: 'MEDIUM', count: 67, percentage: 53.6 },
      { priority: 'LOW', count: 12, percentage: 9.6 }
    ]
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'LOW': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Exécutif */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard Directeur Général
              </h1>
              <p className="text-gray-600 mt-1">
                Vue d'ensemble stratégique • {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </Button>
          </div>
        </div>

        {/* Navigation des vues */}
        <div className="flex space-x-2 mt-6">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: Globe },
            { key: 'workflow', label: 'Workflow', icon: Activity },
            { key: 'performance', label: 'Performance', icon: Target },
            { key: 'review', label: 'Révision Propositions', icon: Crown }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={selectedView === key ? 'default' : 'ghost'}
              onClick={() => setSelectedView(key as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Stratégiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Correspondances</p>
                <p className="text-3xl font-bold mt-2">{dashboardMetrics.totalCorrespondances.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+{dashboardMetrics.monthlyGrowth}% ce mois</span>
                </div>
              </div>
              <FileText className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Taux de Réponse</p>
                <p className="text-3xl font-bold mt-2">{dashboardMetrics.responseRate}%</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{dashboardMetrics.completedThisWeek} cette semaine</span>
                </div>
              </div>
              <Target className="w-12 h-12 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">En Attente</p>
                <p className="text-3xl font-bold mt-2">{dashboardMetrics.pendingApproval + dashboardMetrics.awaitingResponse}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">{dashboardMetrics.averageResponseTime}j temps moyen</span>
                </div>
              </div>
              <Activity className="w-12 h-12 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Alertes Critiques</p>
                <p className="text-3xl font-bold mt-2">{dashboardMetrics.overdueItems}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Attention requise</span>
                </div>
              </div>
              <Zap className="w-12 h-12 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu selon la vue sélectionnée */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Correspondances Critiques */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Correspondances Critiques
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {dashboardMetrics.criticalCorrespondances.map((item, index) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.subject}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>De: {item.from}</span>
                          <span>→ {item.assignedTo}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={getPriorityBadgeVariant(item.priority)}>
                          {item.priority}
                        </Badge>
                        <span className="text-sm font-medium text-red-600">
                          +{item.daysOverdue} jour{item.daysOverdue > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance par Département */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-blue-800">
                <Building className="w-5 h-5 mr-2" />
                Performance par Département
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboardMetrics.departmentPerformance.map((dept, index) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{dept.department}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {dept.completed}/{dept.total}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {dept.responseRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dept.responseRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Workflow Stages */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
              <CardTitle className="flex items-center text-amber-800">
                <Clock className="w-5 h-5 mr-2" />
                En Attente d'Approbation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {metrics.pendingApproval}
                </div>
                <p className="text-gray-600">Correspondances à approuver</p>
                <Button className="mt-4 w-full" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir la liste
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-blue-800">
                <MessageSquare className="w-5 h-5 mr-2" />
                En Attente de Réponse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {metrics.awaitingResponse}
                </div>
                <p className="text-gray-600">Réponses attendues</p>
                <Button className="mt-4 w-full" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Suivre
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                Complétées
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {metrics.completedThisWeek}
                </div>
                <p className="text-gray-600">Cette semaine</p>
                <Button className="mt-4 w-full" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Rapport
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Répartition par Priorité */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-purple-800">
                <Target className="w-5 h-5 mr-2" />
                Répartition par Priorité
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboardMetrics.priorityDistribution.map((priority, index) => (
                  <div key={priority.priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getPriorityColor(priority.priority)}`} />
                      <span className="font-medium">{priority.priority}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getPriorityColor(priority.priority)}`}
                          style={{ width: `${priority.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12">{priority.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tendances Hebdomadaires */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center text-green-800">
                <TrendingUp className="w-5 h-5 mr-2" />
                Tendances Hebdomadaires
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboardMetrics.weeklyTrends.map((week, index) => (
                  <div key={week.week} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{week.week}</span>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-blue-600">↓{week.incoming}</span>
                        <span className="text-green-600">✓{week.processed}</span>
                        <span className="text-amber-600">⏳{week.pending}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${(week.processed / week.incoming) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Révision des Propositions */}
      {selectedView === 'review' && (
        <div className="mb-8">
          <DGResponseReviewPanel />
        </div>
      )}

      {/* Actions Rapides */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <CardTitle className="flex items-center text-gray-800">
            <Zap className="w-5 h-5 mr-2" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center space-y-2" variant="outline">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Approuver Correspondances</span>
            </Button>
            <Button className="h-16 flex flex-col items-center justify-center space-y-2" variant="outline">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">Rapport Mensuel</span>
            </Button>
            <Button className="h-16 flex flex-col items-center justify-center space-y-2" variant="outline">
              <Users className="w-5 h-5" />
              <span className="text-sm">Performance Équipes</span>
            </Button>
            <Button className="h-16 flex flex-col items-center justify-center space-y-2" variant="outline">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Planifier Réunion</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
