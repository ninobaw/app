import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';
import { Loader2, Tag, AlertCircle, CheckCircle } from 'lucide-react';

export const TagsDebugInfo: React.FC = () => {
  const { data: tags, isLoading, error } = useTags();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Debug - Informations Tags
        </CardTitle>
        <CardDescription>
          Informations de debug sur le chargement et l'état des tags
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* État de chargement */}
        <div className="flex items-center gap-2">
          <span className="font-medium">État:</span>
          {isLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Erreur</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Chargé</span>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Erreur de chargement:</p>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        )}

        {/* Nombre de tags */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Nombre de tags:</span>
          <Badge variant="outline">
            {tags ? tags.length : 0}
          </Badge>
        </div>

        {/* Liste des tags */}
        {tags && tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tags disponibles:</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                  className="border flex items-center gap-1"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  {!tag.isActive && (
                    <span className="text-xs opacity-60">(inactif)</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {!isLoading && !error && (!tags || tags.length === 0) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">Aucun tag disponible</p>
            <p className="text-yellow-600 text-sm">
              Créez des tags dans Paramètres &gt; Tags pour les voir ici.
            </p>
          </div>
        )}

        {/* Informations techniques */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Hook:</strong> useTags()</p>
          <p><strong>Endpoint:</strong> GET /api/tags</p>
          <p><strong>Cache:</strong> 5 minutes</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};
