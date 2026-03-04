import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download, Calendar, User, Edit, Trash2, CheckCircle } from 'lucide-react';
import { formatDate, getAbsoluteFilePath } from '@/shared/utils';
import type { DocumentData } from '@/hooks/useDocuments';
import { ViewDocumentDialog } from '@/components/documents/ViewDocumentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst, // Import PaginationFirst
  PaginationLast,  // Import PaginationLast
} from "@/components/ui/pagination";

interface DocumentsListProps {
  documents: DocumentData[];
  isLoading: boolean;
  onEdit?: (document: DocumentData) => void;
  onDelete?: (id: string) => void;
}

export const DocumentsList = ({ documents, isLoading, onEdit, onDelete }: DocumentsListProps) => {
  const [selectedDocumentForView, setSelectedDocumentForView] = useState<DocumentData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  const { user, hasPermission } = useAuth();
  const { updateDocument, isUpdating } = useDocuments();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Display 10 items per page

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const currentItems = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des documents...</p>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun document trouvé
          </h3>
          <p className="text-gray-500">
            Commencez par créer votre premier document.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'ARCHIVED': return 'Archivé';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'QUALITE_DOC': return 'Document Qualité';
      case 'NOUVEAU_DOC': return 'Nouveau Document';
      case 'FORMULAIRE_DOC': return 'Formulaire';
      case 'GENERAL': return 'Manuel / Instruction';
      case 'TEMPLATE': return 'Modèle';
      default: return type;
    }
  };

  const handleViewDocument = (document: DocumentData) => {
    setSelectedDocumentForView(document);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete && onDelete) {
      onDelete(documentToDelete);
      setDocumentToDelete(null);
    }
  };

  const handleApproveDocument = (document: DocumentData) => {
    if (!user) return;

    if (window.confirm(`Êtes-vous sûr de vouloir approuver le document "${document.title}" ?`)) {
      updateDocument({
        id: document.id,
        status: 'ACTIVE',
        approved_by_id: user.id,
      });
    }
  };

  const handleEditButtonClick = (document: DocumentData, editor: 'collabora' | 'microsoft' = 'collabora') => {
    // Check for file path using either file_path or filePath property
    const filePath = document.file_path || document.filePath;
    
    if (filePath) {
      const editorRoutes = {
        collabora: `/documents/edit/${document.id}`,
        microsoft: `/documents/edit-microsoft/${document.id}`
      };
      navigate(editorRoutes[editor]);
    } else {
      if (onEdit) {
        onEdit(document);
      } else {
        alert('Ce document n\'a pas de fichier associé pour l\'édition.');
      }
    }
  };

  const canApprove = hasPermission('approve_documents');
  const canEdit = hasPermission('update_documents');
  const canDelete = hasPermission('delete_documents');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-aviation-sky" />
            Liste des Documents
          </CardTitle>
          <CardDescription>
            Gérer tous les documents disponibles dans le système.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Aéroport</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((document) => (
                  <TableRow key={document.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="line-clamp-2">{document.title}</div>
                      {document.qr_code && (
                        <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded mt-1 inline-block">
                          {document.qr_code.substring(0, 10)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(document.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {document.author?.first_name} {document.author?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {document.airport}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                        {getStatusLabel(document.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(document.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(document)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(document.file_path || document.filePath) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const filePath = document.file_path || document.filePath;
                              if (filePath) {
                                const link = window.document.createElement('a');
                                link.href = getAbsoluteFilePath(filePath);
                                link.download = document.title;
                                window.document.body.appendChild(link);
                                link.click();
                                window.document.body.removeChild(link);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {document.status === 'DRAFT' && canApprove && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveDocument(document)}
                            disabled={isUpdating}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="outline" size="sm" onClick={() => handleEditButtonClick(document, 'collabora')}>
                            <Edit className="w-4 h-4" />
                            Modifier
                          </Button>
                        )}
                        {canDelete && onDelete && (
                          <Button variant="outline" size="sm" onClick={() => handleDeleteClick(document.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-4 flex-col"> {/* Use flex-col to stack page numbers and text */}
              <PaginationContent>
                <PaginationItem>
                  <PaginationFirst // New: First page button
                    href="#"
                    onClick={() => handlePageChange(1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink 
                      href="#" 
                      isActive={currentPage === index + 1} 
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLast // New: Last page button
                    href="#"
                    onClick={() => handlePageChange(totalPages)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
              <div className="text-sm text-gray-600 mt-2 text-center">
                Page {currentPage} sur {totalPages}
              </div>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {selectedDocumentForView && (
        <ViewDocumentDialog
          document={selectedDocumentForView}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le document de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};