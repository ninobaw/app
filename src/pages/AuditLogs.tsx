import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { ActivityLogList } from '@/components/audit/ActivityLogList';

const AuditLogs = () => {
  const { activityLogs, isLoading } = useActivityLogs();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journaux d'Audit</h1>
          <p className="text-gray-500 mt-1">
            Consulter l'historique détaillé de toutes les activités du système.
          </p>
        </div>

        <ActivityLogList logs={activityLogs} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default AuditLogs;