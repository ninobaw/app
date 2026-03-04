import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database } from 'lucide-react';

interface DocumentSettingsSectionProps {
  formData: {
    document_retention: number;
    auto_archive: boolean;
    max_file_size: number;
  };
  updateSetting: (key: string, value: any) => void;
  isUpdating: boolean;
}

export const DocumentSettingsSection: React.FC<DocumentSettingsSectionProps> = ({
  formData,
  updateSetting,
  isUpdating,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Documents
        </CardTitle>
        <CardDescription>
          Configuration de la gestion documentaire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentRetention">Durée de rétention (jours)</Label>
          <Input
            id="documentRetention"
            type="number"
            value={formData.document_retention}
            onChange={(e) => updateSetting('document_retention', parseInt(e.target.value))}
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Archivage automatique</Label>
            <p className="text-sm text-gray-500">
              Archiver automatiquement les anciens documents
            </p>
          </div>
          <Switch
            checked={formData.auto_archive}
            onCheckedChange={(checked) => updateSetting('auto_archive', checked)}
            disabled={isUpdating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxFileSize">Taille max des fichiers (MB)</Label>
          <Input
            id="maxFileSize"
            type="number"
            value={formData.max_file_size}
            onChange={(e) => updateSetting('max_file_size', parseInt(e.target.value))}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
};