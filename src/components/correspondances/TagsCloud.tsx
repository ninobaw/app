import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTags } from '@/hooks/useTags';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { Tag, TrendingUp } from 'lucide-react';

interface TagsCloudProps {
  onTagFilter?: (tag: string) => void;
  selectedTags?: string[];
}

export const TagsCloud: React.FC<TagsCloudProps> = ({ onTagFilter, selectedTags = [] }) => {
  const { data: tags, isLoading: isLoadingTags } = useTags();
  const { correspondances } = useCorrespondances();

  // Calculer les statistiques d'utilisation des tags
  const getTagStats = () => {
    if (!correspondances || !tags) return [];

    const tagStats = new Map<string, { count: number; tag: any }>();

    // Initialiser tous les tags avec count = 0
    tags.forEach(tag => {
      tagStats.set(tag.name, { count: 0, tag });
    });

    // Compter les utilisations
    correspondances.forEach(corr => {
      if (corr.tags && Array.isArray(corr.tags)) {
        corr.tags.forEach(tagName => {
          const current = tagStats.get(tagName);
          if (current) {
            tagStats.set(tagName, { ...current, count: current.count + 1 });
          }
        });
      }
    });

    // Convertir en array et trier par utilisation
    return Array.from(tagStats.values())
      .filter(stat => stat.count > 0) // Seulement les tags utilisés
      .sort((a, b) => b.count - a.count);
  };

  const tagStats = getTagStats();

  // Calculer la taille du badge selon l'utilisation
  const getBadgeSize = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-lg px-4 py-2';
    if (ratio >= 0.6) return 'text-base px-3 py-2';
    if (ratio >= 0.4) return 'text-sm px-3 py-1';
    return 'text-xs px-2 py-1';
  };

  const handleTagClick = (tagName: string) => {
    if (onTagFilter) {
      onTagFilter(tagName);
    }
  };

  if (isLoadingTags) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Nuage de Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Chargement des tags...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Nuage de Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun tag disponible</p>
            <p className="text-sm text-gray-400">Créez des tags dans Paramètres &gt; Tags</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tagStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Nuage de Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun tag utilisé</p>
            <p className="text-sm text-gray-400">Les tags apparaîtront ici une fois utilisés dans les correspondances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...tagStats.map(stat => stat.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Nuage de Tags
        </CardTitle>
        <CardDescription>
          Cliquez sur un tag pour filtrer les correspondances. Taille proportionnelle à l'utilisation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center">
          {tagStats.map(({ tag, count }) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <Badge
                key={tag.id}
                style={{
                  backgroundColor: isSelected 
                    ? tag.color 
                    : tag.color + '20',
                  color: isSelected 
                    ? '#ffffff' 
                    : tag.color,
                  borderColor: tag.color + '60'
                }}
                className={`
                  border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md
                  flex items-center gap-2 ${getBadgeSize(count, maxCount)}
                  ${isSelected ? 'shadow-lg' : 'hover:opacity-80'}
                `}
                onClick={() => handleTagClick(tag.name)}
                title={`${tag.description || tag.name} - ${count} correspondance(s)`}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: isSelected ? '#ffffff' : tag.color 
                  }}
                />
                <span className="font-medium">{tag.name}</span>
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {count}
                </span>
              </Badge>
            );
          })}
        </div>
        
        {/* Statistiques */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{tagStats.length} tag(s) utilisé(s)</span>
            <span>{tags.length} tag(s) total</span>
            <span>{tagStats.reduce((sum, stat) => sum + stat.count, 0)} utilisation(s)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
