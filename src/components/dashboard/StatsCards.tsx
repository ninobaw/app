
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CheckCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalDocuments: number;
    activeUsers: number;
    completedActions: number;
    pendingActions: number;
    documentsThisMonth: number;
    averageCompletionTime: number;
  };
  isLoading: boolean;
}

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Documents Total',
      value: stats.totalDocuments,
      description: 'Documents dans le système',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      description: 'Utilisateurs connectés ce mois',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Actions Terminées',
      value: stats.completedActions,
      description: 'Actions complétées ce mois',
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
    {
      title: 'Actions En Attente',
      value: stats.pendingActions,
      description: 'Actions à traiter',
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      title: 'Docs ce Mois',
      value: stats.documentsThisMonth,
      description: 'Nouveaux documents',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Temps Moyen',
      value: `${stats.averageCompletionTime}j`,
      description: 'Temps de traitement moyen',
      icon: Clock,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </div>
              <p className="text-xs text-gray-500">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
