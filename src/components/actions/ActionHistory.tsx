
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActionHistoryEntry {
  id: string;
  actionId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

interface ActionHistoryProps {
  actionId: string;
  entries: ActionHistoryEntry[];
}

export const ActionHistory: React.FC<ActionHistoryProps> = ({ actionId, entries }) => {
  const filteredEntries = entries.filter(entry => entry.actionId === actionId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-aviation-sky" />
          Historique de l'action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun historique disponible</p>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-aviation-sky rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{entry.action}</p>
                    <span className="text-sm text-gray-500">
                      {format(entry.timestamp, "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Par {entry.userName}</p>
                  {entry.details && (
                    <p className="text-sm text-gray-500 mt-1">{entry.details}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
