import { AppLayout } from '@/components/layout/AppLayout';
import { ClipboardList, Plus, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProcesVerbaux } from '@/hooks/useProcesVerbaux';
import { ProcesVerbauxList } from '@/components/proces-verbaux/ProcesVerbauxList'; // Assuming this component exists or will be created
import { CreateProcesVerbalForm } from '@/components/proces-verbaux/CreateProcesVerbalForm'; // Import the new form component

const ProcesVerbaux = () => {
  const { procesVerbaux, isLoading } = useProcesVerbaux();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procès-Verbaux</h1>
          <p className="text-gray-500 mt-1">
            Créer et gérer les procès-verbaux de réunions
          </p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>Liste des PV</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouveau PV</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            {/* You'll need a ProcesVerbauxList component similar to DocumentsList */}
            {/* For now, a placeholder or an empty list will be shown */}
            <ProcesVerbauxList procesVerbaux={procesVerbaux} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateProcesVerbalForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProcesVerbaux;