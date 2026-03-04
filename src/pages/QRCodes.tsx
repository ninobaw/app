import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QrCode, Search, Download, Eye, Plus, History } from 'lucide-react'; // Added History icon
import { useState } from 'react';
import { useQRCodes } from '@/hooks/useQRCodes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator'; // Import the QRCodeGenerator component
import { ViewDocumentDialog } from '@/components/documents/ViewDocumentDialog'; // Import ViewDocumentDialog
import { useDocuments } from '@/hooks/useDocuments'; // Import useDocuments to get full document data
import { generateQRCodeImage } from '@/shared/utils'; // Import generateQRCodeImage

const QRCodes = () => {
  const { qrCodes, isLoading: isLoadingQRCodes, generateQRCode, isGenerating } = useQRCodes(); // Added generateQRCode and isGenerating
  const { documents, isLoading: isLoadingDocuments } = useDocuments(); // Fetch all documents
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentForView, setSelectedDocumentForView] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const filteredQRCodes = qrCodes.filter(qr => 
    qr.document?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.qr_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewQRCode = (qrData: any) => {
    // Instead of opening a dialog, open the QR code URL directly
    if (qrData.qr_code) {
      window.open(qrData.qr_code, '_blank');
    } else {
      console.error("QR code URL not found for:", qrData);
    }
  };

  const handleRegenerateQRCode = (documentId: string) => {
    generateQRCode(documentId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
            <p className="text-gray-500 mt-1">
              Générer et gérer les codes QR des documents
            </p>
          </div>
          {/* Removed GenerateQRCodeForDocumentDialog as QR codes are auto-generated */}
          {/* <GenerateQRCodeForDocumentDialog /> */}
        </div>

        {/* Recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un document par titre ou code QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des QR Codes */}
        {(isLoadingQRCodes || isLoadingDocuments) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQRCodes.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun QR Code trouvé
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Aucun document ne correspond à votre recherche.' : 'Aucun document avec QR Code disponible.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQRCodes.map((qrData) => (
              <Card key={qrData.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <QrCode className="w-5 h-5 text-aviation-sky" />
                    <Badge variant="outline">
                      {qrData.document?.airport || 'N/A'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {qrData.document?.title || 'Document sans titre'}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="text-xs">
                      {qrData.document?.type || 'N/A'}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    {/* QR Code Image */}
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-white">
                      <img
                        src={qrData.qr_code ? generateQRCodeImage(qrData.qr_code) : ''} // Use utility function
                        alt={`QR Code pour ${qrData.document?.title || 'Document'}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Code QR */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Code QR</p>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {qrData.qr_code.length > 30 ? `${qrData.qr_code.substring(0, 27)}...` : qrData.qr_code}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewQRCode(qrData)} // Open dialog on click
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (qrData.qr_code) {
                            const qrUrl = generateQRCodeImage(qrData.qr_code); // Use utility function
                            const link = document.createElement('a');
                            link.href = qrUrl;
                            link.download = `qr-${qrData.document?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || qrData.id}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleRegenerateQRCode(qrData.document_id)} // Add regenerate button
                        disabled={isGenerating}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Regénérer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog for viewing QR Code details (using ViewDocumentDialog) */}
        {selectedDocumentForView && (
          <ViewDocumentDialog
            document={selectedDocumentForView}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default QRCodes;