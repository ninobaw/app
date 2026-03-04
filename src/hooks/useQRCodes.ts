import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Airport } from '@/shared/types'; // Import Airport type

import { API_ENDPOINTS } from '@/config/api';

export interface QRCodeData {
  id: string;
  document_id: string; // This will now be the ID of the document OR correspondence
  qr_code: string;
  generated_at: string;
  download_count: number;
  last_accessed?: string;
  document?: { // This object will now represent either a Document or a Correspondance
    title: string;
    type: string; // Can be DocumentType or 'CORRESPONDANCE'
    airport: Airport;
    author: {
      first_name: string;
      last_name: string;
    };
  };
}

export const useQRCodes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qrCodes = [], isLoading, error } = useQuery({
    queryKey: ['qr-codes'],
    queryFn: async () => {
      // Fetch documents that have a QR code
      const documentsResponse = await axios.get(API_ENDPOINTS.documents);
      const documentsWithQRCodes = documentsResponse.data.filter((doc: any) => doc.qr_code) as any[];
      
      // Fetch correspondences that have a QR code
      const correspondencesResponse = await axios.get(`API_ENDPOINTS.dashboard/correspondances`);
      const correspondencesWithQRCodes = correspondencesResponse.data.filter((corr: any) => corr.qr_code) as any[];

      const mappedDocuments = documentsWithQRCodes.map(doc => ({
        id: doc.id,
        document_id: doc.id,
        qr_code: doc.qr_code,
        generated_at: doc.created_at,
        download_count: doc.downloads_count || 0,
        last_accessed: doc.updated_at,
        document: {
          title: doc.title,
          type: doc.type,
          airport: doc.airport,
          author: doc.author
        }
      }));

      const mappedCorrespondences = correspondencesWithQRCodes.map(corr => ({
        id: corr.id,
        document_id: corr.id, // Use correspondence ID here
        qr_code: corr.qr_code,
        generated_at: corr.created_at,
        download_count: corr.downloads_count || 0,
        last_accessed: corr.updated_at,
        document: { // Map correspondence fields to 'document' structure for consistency
          title: corr.subject, // Use subject as title for display
          type: 'CORRESPONDANCE', // Explicitly set type
          airport: corr.airport,
          author: corr.author // Assuming author is populated
        }
      }));

      return [...mappedDocuments, ...mappedCorrespondences] as QRCodeData[];
    },
  });

  const generateQRCode = useMutation({
    mutationFn: async (documentId: string) => {
      // Determine if it's a document or correspondence based on ID (or type if passed)
      // For simplicity, we'll try to update document first, then correspondence
      try {
        const newQRCodeValue = `QR-${documentId.substring(0, 8).toUpperCase()}-${Date.now()}`;
        const response = await axios.put(`API_ENDPOINTS.documents/${documentId}`, { qr_code: newQRCodeValue });
        return response.data;
      } catch (docError) {
        // If not a document, try updating as a correspondence
        try {
          const newQRCodeValue = `QR-${documentId.substring(0, 8).toUpperCase()}-${Date.now()}`;
          const response = await axios.put(`API_ENDPOINTS.dashboard/correspondances/${documentId}`, { qr_code: newQRCodeValue });
          return response.data;
        } catch (corrError) {
          throw new Error('Failed to generate QR code for document or correspondence.');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['correspondances'] }); // Invalidate correspondences too
      toast({
        title: "QR Code généré",
        description: "Un nouveau QR code a été généré pour ce document/correspondance.",
        variant: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Erreur génération QR Code:', error.response?.data || error.message);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || 'Impossible de générer le QR Code.',
        variant: 'destructive',
      });
    },
  });

  return {
    qrCodes,
    isLoading,
    error,
    generateQRCode: generateQRCode.mutate,
    isGenerating: generateQRCode.isPending,
  };
};