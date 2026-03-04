import { AppLayout } from '@/components/layout/AppLayout';
import { FilePlus, List, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplatesList } from '@/components/templates/TemplatesList';
import { UploadTemplateForm } from '@/components/templates/UploadTemplateForm';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const Templates = () => {
  const { user, hasPermission } = useAuth();
  const { templates, isLoading } = useTemplates();

  const canManageTemplates = hasPermission('manage_templates'); // Changed to new permission

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <FilePlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Authentification requise
              </h3>
              <p className="text-gray-500">
                Vous devez être connecté pour accéder aux modèles de documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!canManageTemplates) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <FilePlus className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Accès refusé
              </h3>
              <p className="text-gray-500">
                Vous n'avez pas les permissions nécessaires pour gérer les modèles de documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modèles de Documents</h1>
          <p className="text-gray-500 mt-1">
            Gérer les modèles de documents pour faciliter la création de nouveaux documents.
          </p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>Liste des modèles</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Importer un modèle</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <TemplatesList templates={templates} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <UploadTemplateForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Templates;