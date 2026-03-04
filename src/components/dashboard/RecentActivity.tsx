import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, UserPlus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '@/shared/utils';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface Activity {
  id: string;
  type: 'document_created' | 'user_added' | 'action_completed' | 'action_overdue';
  title: string;
  description: string;
  user: {
    name: string;
    initials: string;
  };
  timestamp: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface RecentActivityProps {
  activities: Activity[];
  isLoading: boolean;
}

export const RecentActivity = ({ activities, isLoading }: RecentActivityProps) => {
  const { user } = useAuth(); // Get user to access language preference
  const userLanguage = user?.language || 'fr'; // Default to 'fr'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>Dernières actions dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'document_created':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'user_added':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'action_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'action_overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
        <CardDescription>Dernières actions dans le système</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune activité récente</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    {activity.priority && (
                      <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {activity.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">
                        {activity.user.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(activity.timestamp, userLanguage)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};