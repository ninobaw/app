import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check, X, Loader2, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useCorrespondances } from '@/hooks/useCorrespondances';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ProgressToast, SuccessToast, ErrorToast } from '@/components/ui/progress-toast';
import { CarGaugeProgress } from '@/components/ui/car-gauge-progress';
import { useImportProgress } from '@/hooks/useImportProgress';

interface ExcelRow {
  title: string;
  type: 'INCOMING' | 'OUTGOING';
  from_address: string;
  to_address: string;
  subject: string;
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'REPLIED' | 'INFORMATIF';
  airport: 'ENFIDHA' | 'MONASTIR' | 'GENERALE';
  tags?: string | string[];
  file_name?: string;
  responseReference?: string;
  responseDate?: string;
  informationTransmittedTo?: string;
  informationAcknowledged?: boolean | string;
  informationActions?: string;
}

export const ImportCorrespondancesExcelDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string>('');
  const [parsedData, setParsedData] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { 
    createCorrespondanceBatch, 
    isCreatingBatch, 
    users, 
    isLoadingUsers,
    clearAllCorrespondances,
    isClearingAll 
  } = useCorrespondances();
  const { uploadFile, uploading: isUploadingAttachment } = useFileUpload();
  const { toast } = useToast();
  const importProgress = useImportProgress();

  // Debug logs
  console.log('ImportCorrespondancesExcelDialog - users count:', users?.length);
  console.log('ImportCorrespondancesExcelDialog - isLoadingUsers:', isLoadingUsers);

  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = [
    'title', 'type', 'from_address', 'to_address', 'subject', 'content',
    'priority', 'status', 'airport', 'tags', 'file_name', 'responseReference', 
    'responseDate', 'informationTransmittedTo', 'informationAcknowledged', 'informationActions'
  ];

  const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setParsedData([]);
      setErrors([]);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const worksheet = workbook.worksheets[0];
          const json: any[] = [];
          worksheet.eachRow((row, rowNumber) => {
            json.push(row.values.slice(1)); // slice(1) to remove the first empty element
          });

          if (json.length === 0) {
            setErrors(['Le fichier Excel est vide.']);
            return;
          }

          const headers = json[0] as string[];
          const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
          if (missingHeaders.length > 0) {
            setErrors([`En-têtes manquants: ${missingHeaders.join(', ')}. Veuillez utiliser le modèle fourni.`]);
            return;
          }

          const rows = json.slice(1).map((row: any[]) => {
            const rowData: any = {};
            headers.forEach((header, index) => {
              rowData[header] = row[index];
            });
            // Extract only the filename from the path if a path is provided
            if (rowData.file_name && typeof rowData.file_name === 'string') {
                rowData.file_name = rowData.file_name.split(/[\\/]/).pop();
            }
            // Convert date string to proper format if provided
            if (rowData.responseDate && typeof rowData.responseDate === 'string') {
              rowData.responseDate = rowData.responseDate;
            }
            return rowData as ExcelRow;
          });

          // Basic validation of parsed data
          const validationErrors: string[] = [];
          const validData: ExcelRow[] = [];

          rows.forEach((row, index) => {
            const rowNum = index + 2; // +1 for 0-indexed, +1 for header row
            let isValidRow = true;

            if (!row.title) { validationErrors.push(`Ligne ${rowNum}: Le champ 'title' est obligatoire.`); isValidRow = false; }
            if (!row.type || !['INCOMING', 'OUTGOING'].includes(row.type)) { validationErrors.push(`Ligne ${rowNum}: Le champ 'type' est obligatoire et doit être 'INCOMING' ou 'OUTGOING'.`); isValidRow = false; }
            if (!row.from_address) { validationErrors.push(`Ligne ${rowNum}: Le champ 'from_address' est obligatoire.`); isValidRow = false; }
            if (!row.to_address) { validationErrors.push(`Ligne ${rowNum}: Le champ 'to_address' est obligatoire.`); isValidRow = false; }
            if (!row.subject) { validationErrors.push(`Ligne ${rowNum}: Le champ 'subject' est obligatoire.`); isValidRow = false; }
            if (!row.airport || !['ENFIDHA', 'MONASTIR', 'GENERALE'].includes(row.airport)) { validationErrors.push(`Ligne ${rowNum}: Le champ 'airport' est obligatoire et doit être 'ENFIDHA', 'MONASTIR' ou 'GENERALE'.`); isValidRow = false; }
            if (row.priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(row.priority)) { validationErrors.push(`Ligne ${rowNum}: Le champ 'priority' est invalide.`); isValidRow = false; }

            if (isValidRow) {
              validData.push({
                ...row,
                priority: row.priority || 'MEDIUM', // Default priority
                status: row.status || 'PENDING', // Default status
                tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag: string) => tag.trim()) : (row.tags || []), // Split tags string into array
                // Convert string boolean to actual boolean for informationAcknowledged
                informationAcknowledged: row.informationAcknowledged === true || row.informationAcknowledged === 'true' || row.informationAcknowledged === '1',
                // Ensure empty strings are converted to undefined for optional fields
                responseReference: row.responseReference || undefined,
                responseDate: row.responseDate || undefined,
                informationTransmittedTo: row.informationTransmittedTo || undefined,
                informationActions: row.informationActions || undefined,
              });
            }
          });

          setParsedData(validData);
          setErrors(validationErrors);

          if (validationErrors.length > 0) {
            toast({
              title: 'Erreurs de validation',
              description: `Certaines lignes du fichier Excel contiennent des erreurs. Veuillez corriger et réessayer.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Fichier analysé',
              description: `${validData.length} correspondances prêtes à être importées.`,
              variant: 'default',
            });
          }

        } catch (err: any) {
          console.error('Error reading Excel file:', err);
          setErrors([`Erreur lors de la lecture du fichier: ${err.message || 'Format invalide.'}`]);
          toast({
            title: 'Erreur de lecture',
            description: `Impossible de lire le fichier Excel. Assurez-vous que le format est correct.`,
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAttachmentFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentFiles(event.target.files);
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || errors.length > 0) {
      toast({
        title: 'Importation impossible',
        description: "Veuillez corriger les erreurs ou charger un fichier Excel valide.",
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCreator) {
      toast({
        title: 'Créateur requis',
        description: "Veuillez sélectionner l'agent créateur des correspondances.",
        variant: 'destructive',
      });
      return;
    }

    const dataToImport = [];
    const attachmentErrors: string[] = [];

    for (const row of parsedData) {
      if (row.file_name) {
        const attachmentFile = attachmentFiles ? Array.from(attachmentFiles).find(f => f.name === row.file_name) : undefined;
        if (!attachmentFile) {
          attachmentErrors.push(`Fichier attaché '${row.file_name}' manquant pour la correspondance '${row.subject}'.`);
          continue;
        }

        try {
          const uploaded = await uploadFile(attachmentFile, {
            documentType: 'correspondances',
            scopeCode: row.airport,
            correspondenceType: row.type,
            allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'],
            maxSize: 10,
            preserveOriginalName: true // Préserver le nom original
          });

          if (uploaded) {
            dataToImport.push({
              ...row,
              file_path: uploaded.path,
              file_type: attachmentFile.type,
              file_name: undefined,
            });
          } else {
            attachmentErrors.push(`Échec du téléchargement du fichier '${row.file_name}' pour la correspondance '${row.subject}'.`);
          }
        } catch (uploadError: any) {
          attachmentErrors.push(`Erreur lors du téléchargement de '${uploadError.message || 'Inconnu'}' pour la correspondance '${row.subject}'.`);
        }
      } else {
        dataToImport.push(row);
      }
    }

    if (attachmentErrors.length > 0) {
      setErrors(prev => [...prev, ...attachmentErrors]);
      toast({
        title: 'Erreurs de fichiers attachés',
        description: `Certains fichiers attachés n'ont pas pu être traités. Veuillez vérifier les messages d'erreur.`,
        variant: 'destructive',
      });
      return;
    }

    // Utiliser le nouveau format avec créateur spécifique
    createCorrespondanceBatch({
      correspondances: dataToImport as any,
      createdBy: selectedCreator
    }, {
      onSuccess: () => {
        setOpen(false);
        setExcelFile(null);
        setAttachmentFiles(null);
        setSelectedCreator('');
        setParsedData([]);
        setErrors([]);
        if (excelFileInputRef.current) excelFileInputRef.current.value = '';
        if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
        
        // Notification de succès moderne déjà gérée par le hook
      },
      onError: (error: any) => {
        console.error('Erreur importation:', error);
        // Notification d'erreur moderne déjà gérée par le hook
      }
    });
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Correspondances');
    
    // Add headers
    worksheet.addRow(expectedHeaders);
    
    // Add example rows
    worksheet.addRow(['Titre exemple', 'OUTGOING', 'expediteur@exemple.com', 'destinataire@exemple.com', 'Objet exemple', 'Contenu exemple', 'MEDIUM', 'PENDING', 'ENFIDHA', 'tag1,tag2', 'facture_001.pdf', 'REP-2024-001', '2024-01-15', 'Service Comptabilité', true, 'Facture transmise et validée']);
    worksheet.addRow(['Autre titre', 'INCOMING', 'autre@expediteur.com', 'mon@email.com', 'Autre objet', 'Autre contenu', 'HIGH', 'INFORMATIF', 'MONASTIR', 'urgent', 'rapport_audit.docx', '', '', 'Directeur Technique', false, 'En attente de traitement']);
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_import_correspondances.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const isImportDisabled = isCreatingBatch || isUploadingAttachment || parsedData.length === 0 || errors.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-aviation-sky text-white hover:bg-aviation-sky/90">
          <Upload className="w-4 h-4 mr-2" />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="import-dialog-content">
        <DialogHeader>
          <DialogTitle>Importer des correspondances depuis Excel</DialogTitle>
        </DialogHeader>
        <div className="import-dialog-scroll">{/* Contenu scrollable avec padding pour la scrollbar */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Format du fichier Excel</AlertTitle>
            <AlertDescription>
              Votre fichier Excel doit contenir les en-têtes suivants dans la première ligne (respectez la casse) :<br/>
              <code className="font-mono text-xs">title, type, from_address, to_address, subject, content, priority, status, airport, tags, file_name, responseReference, responseDate, informationTransmittedTo, informationAcknowledged, informationActions</code><br/>
              <Button variant="link" className="p-0 h-auto text-blue-600" onClick={downloadTemplate}>
                Télécharger un modèle Excel
              </Button>
              <p className="mt-2 text-sm font-semibold text-orange-700">
                Pour attacher des fichiers, indiquez le nom exact du fichier (ex: `facture_001.pdf`) dans la colonne `file_name` de l'Excel, puis sélectionnez ces fichiers via le champ "Fichiers attachés" ci-dessous.
              </p>
            </AlertDescription>
          </Alert>

          {/* Section principale - Grille responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-4">
              {/* Upload Excel */}
              <div className="upload-section border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Sélectionnez votre fichier Excel
                </p>
                <Input
                  type="file"
                  onChange={handleExcelFileChange}
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="excel-file-upload"
                  ref={excelFileInputRef}
                />
                <Label htmlFor="excel-file-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => excelFileInputRef.current?.click()}
                  >
                    Sélectionner le fichier Excel
                  </Button>
                </Label>
                {excelFile && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-aviation-sky" />
                    <span className="text-sm font-medium">{excelFile.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setExcelFile(null); setParsedData([]); setErrors([]); if (excelFileInputRef.current) excelFileInputRef.current.value = ''; }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Sélecteur d'agent créateur */}
              <div className="upload-section border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Sélectionnez l'agent créateur des correspondances
                </p>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Chargement des utilisateurs...</span>
                  </div>
                ) : (
                  <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir un agent créateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users && Array.isArray(users) && users.length > 0 ? (
                        users.map(user => {
                          const userId = user._id || user.id;
                          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                                         user.name || 
                                         user.username || 
                                         'Utilisateur sans nom';
                          const userEmail = user.email || '';
                          
                          return (
                            <SelectItem key={userId} value={userId}>
                              {userName} ({userEmail})
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="" disabled>
                          Aucun utilisateur avec accès aux correspondances
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              {/* Attachment Files Upload */}
              <div className="upload-section border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Sélectionnez tous les fichiers attachés mentionnés dans votre Excel
                </p>
                <Input
                  type="file"
                  onChange={handleAttachmentFilesChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  id="attachment-files-upload"
                  ref={attachmentFileInputRef}
                />
                <Label htmlFor="attachment-files-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => attachmentFileInputRef.current?.click()}
                  >
                    Sélectionner les fichiers attachés
                  </Button>
                </Label>
                {attachmentFiles && attachmentFiles.length > 0 && (
                  <div className="mt-4 text-left max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium mb-2">Fichiers sélectionnés ({attachmentFiles.length}):</p>
                    <div className="space-y-1">
                      {Array.from(attachmentFiles).map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton de suppression */}
              <div className="upload-section border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Supprimer toutes les correspondances
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (clearAllCorrespondances) {
                      clearAllCorrespondances();
                    } else {
                      console.error('clearAllCorrespondances function not available');
                      toast({
                        title: 'Erreur',
                        description: "Fonction de suppression non disponible",
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={isClearingAll}
                >
                  {isClearingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer tout'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erreurs détectées</AlertTitle>
              <AlertDescription>
                <div className="max-h-32 overflow-y-auto mt-2">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Aperçu des données ({parsedData.length} correspondances)</h3>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Télécharger le modèle
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-64 w-full">
                  <Table className="preview-table text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Titre</TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[150px]">De</TableHead>
                        <TableHead className="min-w-[150px]">À</TableHead>
                        <TableHead className="min-w-[120px]">Objet</TableHead>
                        <TableHead className="min-w-[100px]">Priorité</TableHead>
                        <TableHead className="min-w-[80px]">Aéroport</TableHead>
                        <TableHead className="min-w-[100px]">Fichier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.title}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              row.type === 'INCOMING' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {row.type}
                            </span>
                          </TableCell>
                          <TableCell className="truncate max-w-[150px]">{row.from_address}</TableCell>
                          <TableCell className="truncate max-w-[150px]">{row.to_address}</TableCell>
                          <TableCell className="truncate max-w-[120px]">{row.subject}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              row.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              row.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              row.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {row.priority || 'MEDIUM'}
                            </span>
                          </TableCell>
                          <TableCell>{row.airport}</TableCell>
                          <TableCell className="truncate max-w-[100px]">{row.file_name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {parsedData.length > 10 && (
                  <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-600">
                    ... et {parsedData.length - 10} autres correspondances
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={parsedData.length === 0 || errors.length > 0 || isCreatingBatch || !selectedCreator}
              className="bg-aviation-sky hover:bg-aviation-sky/90"
            >
              {isCreatingBatch ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importer {parsedData.length} correspondances
                </>
              )}
            </Button>
          </div>

          {/* Jauge de progression */}
          {importProgress.isImporting && (
            <div className="mt-6 p-4 bg-white rounded-lg border shadow-sm">
              <CarGaugeProgress
                progress={importProgress.progress}
                total={importProgress.total}
                current={importProgress.current}
                title="Importation des correspondances"
                isComplete={importProgress.phase === 'complete'}
              />
              <div className="mt-2 text-center text-sm text-gray-600">
                {importProgress.message}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};