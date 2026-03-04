import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Eye, Calendar, Users, Clock, Edit } from 'lucide-react';
import { formatDate } from '@/shared/utils';
import type { ActionData } from '@/hooks/useActions';

interface ActionsListProps {
  actions: ActionData[];
  isLoading: boolean;
  onEdit?: (action: ActionData) => void;
}

export const ActionsList = ({ actions, isLoading, onEdit }: ActionsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune action trouvée
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre première action.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Terminée';
      case 'IN_PROGRESS': return 'En cours';
      case 'PENDING': return 'En attente';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Card key={action.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-aviation-sky" />
              </div>
              <div className="flex space-x-1">
                <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                  {action.priority}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(action.status)}`}>
                  {getStatusLabel(action.status)}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {action.title}
            </CardTitle>
            {action.description && (
              <CardDescription className="line-clamp-2">
                {action.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Progression</span>
                  <span className="font-medium">{action.progress}%</span>
                </div>
                <Progress value={action.progress} className="h-2" />
              </div>

              {action.document && (
                <div className="text-xs text-gray-500">
                  Document: {action.document.title}
                </div>
              )}

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(action.due_date)}</span>
                </div>
                {action.estimated_hours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{action.estimated_hours}h</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{(action.assigned_to || []).length} assigné(s)</span>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(action)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};