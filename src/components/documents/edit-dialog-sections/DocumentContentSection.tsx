import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Assuming version is also here

interface DocumentContentSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const DocumentContentSection: React.FC<DocumentContentSectionProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="version">Version</Label>
        <Input
          id="version"
          value={formData.version}
          readOnly
          className="bg-gray-100"
        />
        <p className="text-xs text-gray-500">
          La version est incrémentée automatiquement lors du remplacement du fichier.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          placeholder="Description détaillée du document..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenu du document</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, content: e.target.value }))}
          placeholder="Saisissez le contenu complet du document..."
          rows={8}
        />
      </div>
    </>
  );
};