import React from 'react';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/TagInput';

interface DocumentTagsInputProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const DocumentTagsInput: React.FC<DocumentTagsInputProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <TagInput
        tags={formData.tags}
        onTagsChange={(newTags) => setFormData((prev: any) => ({ ...prev, tags: newTags }))}
        placeholder="Ajouter des tags (ex: sécurité, maintenance)"
      />
      <p className="text-xs text-gray-500">
        Appuyez sur Entrée pour ajouter un tag.
      </p>
    </div>
  );
};