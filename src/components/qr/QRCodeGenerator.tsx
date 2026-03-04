import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download, Eye, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments'; // Import useDocuments
import { generateQRCodeImage } from '@/shared/utils'; // Import the utility function
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface QRCodeGeneratorProps {
  documentId: string;
  documentTitle: string;
  initialQrCode?: string; // Pass existing QR code
  initialDownloadCount?: number; // Pass existing download count
  initialLastAccessed?: string; // Pass existing last accessed date
  onQRCodeUpdated?: (qrCode: string, downloadCount: number, lastAccessed: string) => void; // Callback for parent
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  documentId,
  documentTitle,
  initialQrCode,
  initialDownloadCount = 0,
  initialLastAccessed,
  onQRCodeUpdated
}) => {
  const { user } = useAuth(); // Get user to access language preference
  const userLanguage = user?.language || 'fr'; // Default to 'fr'

  const [currentQrCode, setCurrentQrCode] = useState<string | undefined>(initialQrCode);
  const [currentDownloadCount, setCurrentDownloadCount] = useState<number>(initialDownloadCount);
  const [currentLastAccessed, setCurrentLastAccessed] = useState<string | undefined>(initialLastAccessed);
  
  const { updateDocument, isUpdating } = useDocuments();

  useEffect(() => {
    setCurrentQrCode(initialQrCode);
    setCurrentDownloadCount(initialDownloadCount);
    setCurrentLastAccessed(initialLastAccessed);
  }, [initialQrCode, initialDownloadCount, initialLastAccessed]);

  const handleGenerateQRCode = () => {
    // Generate a new unique QR code value
    const newQrCodeValue = `QR-${documentId.substring(0, 8).toUpperCase()}-${Date.now()}`;
    
    updateDocument({ 
      id: documentId, 
      qr_code: newQrCodeValue,
      downloads_count: 0, // Reset downloads on re-generation
      updated_at: new Date().toISOString(), // Update timestamp
    }, {
      onSuccess: (data) => {
        setCurrentQrCode(data.qr_code);
        setCurrentDownloadCount(data.downloads_count || 0);
        setCurrentLastAccessed(data.updated_at);
        onQRCodeUpdated?.(data.qr_code, data.downloads_count || 0, data.updated_at);
        toast({
          title: "QR Code généré",
          description: "Un nouveau QR code a été généré pour ce document.",
          variant: 'success',
        });
      },
      onError: () => {
        toast({
          title: "Erreur de génération",
          description: "Impossible de générer le QR code.",
          variant: "destructive"
        });
      }
    });
  };

  const handleDownload = () => {
    if (currentQrCode) {
      const qrUrl = generateQRCodeImage(currentQrCode);
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `qr-${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || documentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count in backend
      const newDownloadCount = currentDownloadCount + 1;
      const newLastAccessed = new Date().toISOString();
      updateDocument({
        id: documentId,
        downloads_count: newDownloadCount,
        updated_at: newLastAccessed, // Update last accessed time
      }, {
        onSuccess: (data) => {
          setCurrentDownloadCount(data.downloads_count || 0);
          setCurrentLastAccessed(data.updated_at);
          onQRCodeUpdated?.(data.qr_code, data.downloads_count || 0, data.updated_at);
          toast({
            title: "QR Code téléchargé",
            description: "Le QR code a été téléchargé avec succès.",
            variant: 'success',
          });
        },
        onError: () => {
          toast({
            title: "Erreur de téléchargement",
            description: "Impossible de mettre à jour le compteur de téléchargement.",
            variant: "destructive"
          });
        }
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-aviation-sky" />
            QR Code du Document
          </div>
          {currentQrCode && (
            <Badge className="bg-green-100 text-green-800">Généré</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isUpdating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aviation-sky mx-auto"></div>
            <p className="mt-4 text-gray-600">Opération en cours...</p>
          </div>
        ) : currentQrCode ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 mx-auto rounded-lg flex items-center justify-center">
                <img
                  src={generateQRCodeImage(currentQrCode)}
                  alt={`QR Code pour ${documentTitle}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="mt-2 text-sm font-mono text-gray-600">{currentQrCode}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Téléchargements:</p>
                <p className="font-medium">{currentDownloadCount}</p>
              </div>
              <div>
                <p className="text-gray-600">Dernier accès:</p>
                <p className="font-medium">
                  {currentLastAccessed ? 
                    new Date(currentLastAccessed).toLocaleDateString(userLanguage) : 
                    'Jamais'
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleDownload} className="flex-1" disabled={isUpdating}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleGenerateQRCode} disabled={isUpdating}>
                <History className="w-4 h-4 mr-2" />
                Regénérer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun QR code généré</p>
            <Button onClick={handleGenerateQRCode} className="mt-4" disabled={isUpdating}>
              Générer QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};