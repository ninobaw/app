import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Eye, Calendar, User, Edit, Trash2, FileDown } from 'lucide-react'; // Import FileDown
import { formatDate } from '@/shared/utils';
import type { ProcesVerbalData } from '@/hooks/useProcesVerbaux';
import { useProcesVerbaux } from '@/hooks/useProcesVerbaux';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { getAbsoluteFilePath } from '@/shared/utils'; // Import getAbsoluteFilePath

interface ProcesVerbauxListProps {
  procesVerbaux: ProcesVerbalData[];
  isLoading: boolean;
  onEdit?: (pv: ProcesVerbalData) => void;
}

export const ProcesVerbauxList = ({ procesVerbaux, isLoading, onEdit }: ProcesVerbauxListProps) => {
  const { deleteProcesVerbal, isDeleting } = useProcesVerbaux();
  const navigate = useNavigate(); // Initialize useNavigate
  const { toast } = useToast(); // Initialize useToast

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

  if (procesVerbaux.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun procès-verbal trouvé
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre premier procès-verbal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le procès-verbal "${title}" ?`)) {
      deleteProcesVerbal(id);
    }
  };

  const handleEditButtonClick = (pv: ProcesVerbalData, editor: 'collabora' | 'microsoft' = 'collabora') => {
    if (pv.file_path) {
      const editorRoutes = {
        collabora: `/proces-verbaux/edit-collabora/${pv.id}`,
        microsoft: `/proces-verbaux/edit-microsoft/${pv.id}`
      };
      navigate(editorRoutes[editor]);
    } else {
      // If no file, show a toast message or open a metadata edit dialog if one existed
      toast({
        title: 'Pas de fichier',
        description: 'Ce procès-verbal n\'a pas de fichier associé pour l\'édition.',
        variant: 'info',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {procesVerbaux.map((pv) => (
        <Card key={pv.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-aviation-sky" />
                <Badge variant="outline" className="text-xs">
                  {pv.airport}
                </Badge>
              </div>
              <Badge className="text-xs bg-blue-100 text-blue-800">
                {pv.meeting_type}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {pv.document?.title || pv.title}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">{pv.location}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-3">
                {pv.agenda}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(pv.meeting_date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{pv.author?.firstName} {pv.author?.lastName}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => window.open(pv.qr_code, '_blank')}>
                  <Eye className="w-4 h-4 mr-1" />
                  Voir détails
                </Button>
                {pv.file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = getAbsoluteFilePath(pv.file_path!);
                      link.download = `pv-${pv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || pv.id}.${pv.file_type?.split('/')[1] || 'file'}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                )}
                {pv.file_path && (
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleEditButtonClick(pv, 'collabora')} title="Éditer avec Collabora Online">
                      <Edit className="w-4 h-4" />
                      Collabora
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditButtonClick(pv, 'microsoft')} title="Éditer avec Microsoft Office 365">
                      <Edit className="w-4 h-4" />
                      Microsoft
                    </Button>
                  </div>
                )}
                {!pv.file_path && (
                  <Button variant="outline" size="sm" onClick={() => handleEditButtonClick(pv)}>
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(pv.id, pv.document?.title || pv.title)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};