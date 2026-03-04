import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Play, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/shared/utils';
import type { ReportData } from '@/hooks/useReports';
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

interface ReportsListProps {
  reports: ReportData[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
}

export const ReportsList = ({ reports, isLoading, onDelete }: ReportsListProps) => {
  const { hasPermission } = useAuth();
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

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

  if (reports.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun rapport trouvé
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre premier rapport.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DOCUMENT_USAGE': return 'Utilisation documents';
      case 'USER_ACTIVITY': return 'Activité utilisateurs';
      case 'ACTION_STATUS': return 'Statut actions';
      case 'PERFORMANCE': return 'Performance';
      case 'CUSTOM': return 'Personnalisé';
      default: return type;
    }
  };

  const handleDeleteClick = (id: string) => {
    setReportToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (reportToDelete && onDelete) {
      onDelete(reportToDelete);
      setReportToDelete(null);
    }
  };

  const canDelete = hasPermission('view_reports'); // Assuming 'view_reports' implies delete for now, adjust if needed

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-aviation-sky" />
                </div>
                <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                  {report.status}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {report.name}
              </CardTitle>
              <CardDescription>
                {getTypeLabel(report.type)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.frequency && (
                  <div className="text-xs text-gray-500">
                    Fréquence: {report.frequency}
                  </div>
                )}

                {report.last_generated && (
                  <div className="text-xs text-gray-500">
                    Dernière génération: {formatDate(report.last_generated)}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Créé le: {formatDate(report.created_at)}
                </div>

                <div className="flex justify-between pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem className="cursor-pointer">
                        <Play className="mr-2 h-4 w-4" />
                        Générer
                      </DropdownMenuItem>
                      {report.content && (
                        <DropdownMenuItem className="cursor-pointer">
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600" 
                          onClick={() => handleDeleteClick(report.id)}
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

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le rapport de nos serveurs.
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