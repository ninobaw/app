import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Eye, X, Download } from 'lucide-react';
import { DocumentData } from '@/hooks/useDocuments';
import { getAbsoluteFilePath } from '@/shared/utils';

interface DocumentFileManagementProps {
  document: DocumentData | null;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: () => void;
}

export const DocumentFileManagement: React.FC<DocumentFileManagementProps> = ({
  document,
  selectedFile,
  previewUrl,
  fileInputRef,
  handleFileUpload,
  removeFile,
}) => {
  return (
    <div className="space-y-4">
      <Label>Remplacer le fichier du document (optionnel)</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Glissez-déposez un nouveau fichier ici ou cliquez pour sélectionner
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Formats supportés: PDF, Word, Excel, PowerPoint (max 10MB)
        </p>
        <Input
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          id="document-file-upload"
          ref={fileInputRef}
        />
        <Label htmlFor="document-file-upload" className="cursor-pointer">
          <Button type="button" variant="outline">
            Sélectionner un nouveau fichier
          </Button>
        </Label>
      </div>

      {(selectedFile || document?.file_path) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {selectedFile?.name || document?.file_path?.split('/').pop() || 'Fichier actuel'}
              </p>
              <p className="text-sm text-gray-500">
                {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Fichier existant'}
              </p>
            </div>
            <div className="flex space-x-2">
              {(selectedFile && previewUrl) || (document?.file_path && getAbsoluteFilePath(document.file_path)) ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => window.open(selectedFile ? previewUrl! : getAbsoluteFilePath(document!.file_path!), '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
              ) : null}
              {document?.file_path && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = getAbsoluteFilePath(document.file_path!);
                    link.download = document.title;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              )}
              {selectedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};