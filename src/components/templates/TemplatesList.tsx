import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Eye, FilePlus, MoreHorizontal } from 'lucide-react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils'; // Import getAbsoluteFilePath
import type { TemplateData } from '@/hooks/useTemplates';
import { useTemplates } from '@/hooks/useTemplates';
import { useFileUpload } from '@/hooks/useFileUpload'; // To delete the actual file
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';

interface TemplatesListProps {
  templates: TemplateData[];
  isLoading: boolean;
}

export const TemplatesList = ({ templates, isLoading }: TemplatesListProps) => {
  const { deleteTemplate, isDeleting } = useTemplates();
  const { deleteFile } = useFileUpload();
  const { hasPermission } = useAuth();
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; filePath?: string; title?: string } | null>(null);

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

  if (templates.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <FilePlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun modèle trouvé
          </h3>
          <p className="text-gray-500">
            Commencez par importer votre premier modèle de document.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDeleteClick = (id: string, filePath?: string, title?: string) => {
    setTemplateToDelete({ id, filePath, title });
  };

  const handleConfirmDelete = async () => {
    if (templateToDelete) {
      // First, try to delete the file from the backend storage
      if (templateToDelete.filePath) {
        const fileDeleted = await deleteFile(templateToDelete.filePath);
        if (!fileDeleted) {
          // If file deletion fails, you might want to stop here or log a warning
          // For now, we'll proceed to delete the database entry even if the file remains
          console.warn(`Failed to delete physical file for template ${templateToDelete.title}. Proceeding with database deletion.`);
        }
      }
      // Then, delete the template entry from the database
      deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const canDelete = hasPermission('manage_templates');

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-aviation-sky" />
                  <Badge variant="outline" className="text-xs">
                    {template.airport}
                  </Badge>
                </div>
                <Badge className="text-xs bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {template.title}
              </CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="text-xs">
                  Modèle
                </Badge>
                {template.qr_code && (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                    {template.qr_code}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.content && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.content}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>Version: {template.version}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Créé le: {formatDate(template.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      {template.file_path && (
                        <DropdownMenuItem 
                          className="cursor-pointer" 
                          onClick={() => window.open(getAbsoluteFilePath(template.file_path), '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualiser
                        </DropdownMenuItem>
                      )}
                      {template.file_path && (
                        <DropdownMenuItem 
                          className="cursor-pointer" 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = getAbsoluteFilePath(template.file_path);
                            link.download = template.title;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600" 
                          onClick={() => handleDeleteClick(template.id, template.file_path, template.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le modèle "{templateToDelete?.title}" de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};