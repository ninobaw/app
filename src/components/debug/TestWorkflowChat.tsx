import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WorkflowChatPanel from '../workflow/WorkflowChatPanel';

const TestWorkflowChat: React.FC = () => {
  const [workflowId, setWorkflowId] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);

  const handleTest = () => {
    if (workflowId.trim()) {
      setShowChat(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Chat Workflow - DG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Workflow ID à tester:
              </label>
              <Input
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                placeholder="Entrez l'ID du workflow"
              />
            </div>
            <Button onClick={handleTest} disabled={!workflowId.trim()}>
              Tester le Chat
            </Button>
          </div>
          
          {showChat && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">Chat pour Workflow: {workflowId}</h3>
              <div className="h-96 border rounded-lg overflow-hidden">
                <WorkflowChatPanel 
                  workflowId={workflowId}
                  onMessageSent={() => {
                    console.log('💬 Message envoyé dans le test');
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>📋 Instructions de test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Ouvrez la console du navigateur (F12)</li>
            <li>Récupérez un ID de workflow depuis la base de données</li>
            <li>Collez l'ID dans le champ ci-dessus</li>
            <li>Cliquez sur "Tester le Chat"</li>
            <li>Vérifiez si le chat se charge correctement</li>
            <li>Essayez d'envoyer un message</li>
            <li>Vérifiez les logs dans la console</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestWorkflowChat;
