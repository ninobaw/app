import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Eye, Download, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/shared/utils';
import { useFormulaires } from '@/hooks/useFormulaires';
import type { FormulaireData } from '@/hooks/useFormulaires';

interface FormulairesListProps {
  formulaires: FormulaireData[];
  isLoading: boolean;
}

export const FormulairesList = ({ formulaires, isLoading }: FormulairesListProps) => {
  const { deleteFormulaire, isDeleting } = useFormulaires();

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

  if (formulaires.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun formulaire trouvé
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre premier formulaire documentaire.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'ARCHIVED': return 'Archivé';
      default: return status;
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le formulaire "${title}" ?`)) {
      deleteFormulaire(id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {formulaires.map((formulaire) => {
        const content = formulaire.content ? JSON.parse(formulaire.content) : {};
        
        return (
          <Card key={formulaire.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-aviation-sky" />
                  <Badge variant="outline" className="text-xs">
                    {formulaire.airport}
                  </Badge>
                </div>
                <Badge className={`text-xs ${getStatusColor(formulaire.status)}`}>
                  {getStatusLabel(formulaire.status)}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {formulaire.title}
              </CardTitle>
              <CardDescription>
                {content.code && (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {content.code}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {content.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {content.description}
                  </p>
                )}
                
                {content.category && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Catégorie:</span>
                    <Badge variant="secondary" className="text-xs">
                      {content.category}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>
                      {formulaire.author?.firstName} {formulaire.author?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(formulaire.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 space-x-2">
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      DL
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(formulaire.id, formulaire.title)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};