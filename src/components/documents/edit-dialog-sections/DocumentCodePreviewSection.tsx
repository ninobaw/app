import React from 'react';
import { Input } from '@/components/ui/input';
import { DocumentData } from '@/hooks/useDocuments';
import { Label } from '@/components/ui/label';
import { generateDocumentCodePreview } from '@/shared/utils'; // Import the utility

interface DocumentCodePreviewSectionProps {
  document: DocumentData | null;
  previewQrCodeEdit: string;
}

export const DocumentCodePreviewSection: React.FC<DocumentCodePreviewSectionProps> = ({
  document,
  previewQrCodeEdit,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Code QR Actuel</Label>
        <Input
          value={document?.qr_code || 'N/A'}
          readOnly
          className="font-mono bg-gray-100 text-gray-700"
        />
        <p className="text-xs text-gray-500">
          Code QR attribué à ce document.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Prévisualisation du Nouveau Code</Label>
        <Input
          value={previewQrCodeEdit}
          readOnly
          className="font-mono bg-gray-100 text-gray-700"
        />
        <p className="text-xs text-gray-500">
          Ce code sera généré si les champs de codification sont modifiés.
        </p>
      </div>
    </div>
  );
};