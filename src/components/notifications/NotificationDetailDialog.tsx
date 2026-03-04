import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Notification } from '@/hooks/useNotifications';
import { Info, FileText, Mail, ClipboardList, CheckSquare, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/shared/utils';

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationDetailDialog: React.FC<NotificationDetailDialogProps> = ({
  notification,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const getEntityRoute = (entityType: Notification['entity_type'], entityId: string | undefined) => {
    if (!entityId) return null;
    switch (entityType) {
      case 'DOCUMENT':
        return `/documents`; // Go to documents list to choose editor
      case 'ACTION':
        return `/actions`; // Actions list, user can filter
      case 'CORRESPONDANCE':
        return `/correspondances`; // Go to correspondances list to choose editor
      case 'PROCES_VERBAL':
        return `/proces-verbaux`; // Go to proces-verbaux list to choose editor
      case 'USER':
        return `/users`; // Users list, user can search
      case 'REPORT':
        return `/reports`;
      case 'SETTINGS':
        return `/settings`;
      default:
        return null;
    }
  };

  const getEntityIcon = (entityType: Notification['entity_type']) => {
    switch (entityType) {
      case 'DOCUMENT': return <FileText className="w-5 h-5 mr-2" />;
      case 'ACTION': return <CheckSquare className="w-5 h-5 mr-2" />;
      case 'CORRESPONDANCE': return <Mail className="w-5 h-5 mr-2" />;
      case 'PROCES_VERBAL': return <ClipboardList className="w-5 h-5 mr-2" />;
      case 'USER': return <User className="w-5 h-5 mr-2" />;
      case 'REPORT': return <Settings className="w-5 h-5 mr-2" />;
      case 'SETTINGS': return <Settings className="w-5 h-5 mr-2" />;
      default: return <Info className="w-5 h-5 mr-2" />;
    }
  };

  const handleViewRelatedItem = () => {
    if (notification.entity_id && notification.entity_type) {
      const route = getEntityRoute(notification.entity_type, notification.entity_id);
      if (route) {
        onOpenChange(false); // Close dialog
        navigate(route);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Détails de la Notification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
            <p className="text-sm text-gray-500">{formatDate(notification.created_at)}</p>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{notification.message}</p>

          {notification.entity_id && notification.entity_type && (
            <div className="pt-2">
              <Button variant="outline" onClick={handleViewRelatedItem} className="w-full">
                {getEntityIcon(notification.entity_type)}
                Voir l'élément lié
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};