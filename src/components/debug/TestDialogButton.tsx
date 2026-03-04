import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TestTube } from 'lucide-react';
import { ResponseConversationDialog } from '../correspondances/ResponseConversationDialog';

export const TestDialogButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Données de test pour le dialogue
  const testCorrespondanceData = {
    _id: '68dbcd9219210e8873b4bea4',
    subject: 'Test - Autorisation de vol charter pour événement spécial',
    content: 'Ceci est un test du dialogue conversationnel.',
    priority: 'HIGH',
    status: 'PENDING',
    workflowStatus: 'ASSIGNED_TO_DIRECTOR',
    createdAt: new Date().toISOString()
  };

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center text-green-800">
          <TestTube className="w-5 h-5 mr-2" />
          Test Dialogue Conversationnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-green-700">
            Cliquez sur ce bouton pour tester directement le dialogue conversationnel 
            avec des données de test, même si les vraies données ne se chargent pas.
          </p>
          
          <Button 
            onClick={() => setDialogOpen(true)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ouvrir Dialogue Test
          </Button>

          <div className="text-xs text-green-600 space-y-1">
            <p><strong>ID de test :</strong> {testCorrespondanceData._id}</p>
            <p><strong>Sujet :</strong> {testCorrespondanceData.subject}</p>
            <p><strong>Statut :</strong> {testCorrespondanceData.workflowStatus}</p>
          </div>
        </div>

        {/* Dialogue de test */}
        <ResponseConversationDialog
          correspondanceId={testCorrespondanceData._id}
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          correspondanceData={testCorrespondanceData}
        />
      </CardContent>
    </Card>
  );
};
