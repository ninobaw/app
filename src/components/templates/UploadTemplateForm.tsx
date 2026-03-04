import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload, FileText, Eye, X, FilePlus } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Airport, DocumentCodeConfig } from '@/shared/types';
import { useDocumentCodeConfig } from '@/hooks/useDocumentCodeConfig';
import { generateDocumentCodePreview } from '@/shared/utils';

export const UploadTemplateForm: React.FC = () => {
  const { user } = useAuth();
  const { createTemplate, isCreating } = useTemplates();
  const { uploadTemplate, uploading: isUploadingFile } = useFileUpload();
  const { config: codeConfig, isLoading: isLoadingCodeConfig } = useDocumentCodeConfig();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initialDepartmentCode = useMemo(() => {
    if (user && codeConfig?.departments) {
      const foundDept = codeConfig.departments.find(d => d.label === user.department);
      return foundDept ? foundDept.code : undefined;
    }
    return undefined;
  }, [user, codeConfig]);

  const [formData, setFormData] = useState({
    title: '',
    airport: user?.airport || 'ENFIDHA' as Airport, // This will map to scope_code
    description: '',
    company_code: 'TAVTUN', // Default value
    document_type_code: undefined as string | undefined, // Specific for templates, e.g., 'PQ', 'MN'
    department_code: undefined as string | undefined,
    sub_department_code: undefined as string | undefined,
    language_code: 'FR', // Default value
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && codeConfig) {
      const defaultAirport = user.airport || 'ENFIDHA';
      const defaultLanguage = 'FR';

      const foundDept = codeConfig.departments.find(d => d.label === user.department);
      const userDepartmentCode = foundDept ? foundDept.code : undefined;

      setFormData(prev => ({
        ...prev,
        airport: defaultAirport,
        department_code: userDepartmentCode,
        language_code: defaultLanguage,
      }));
    }
  }, [user, codeConfig]);

  const previewTemplateCode = useMemo(() => {
    // For templates, we use a placeholder sequence number (e.g., '000' or 'TPL')
    // The actual sequence number will be generated when a document is created from this template.
    return generateDocumentCodePreview(
      formData.company_code,
      formData.airport,
      formData.department_code,
      formData.sub_department_code,
      formData.document_type_code,
      formData.language_code
    );
  }, [
    formData.company_code,
    formData.airport,
    formData.department_code,
    formData.sub_department_code,
    formData.document_type_code,
    formData.language_code
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('handleFileUpload triggered. File:', file);
    if (file) {
      console.log('Fichier sélectionné:', file);
      setSelectedFile(file);
      
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      const url = window.URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      console.log('Aucun fichier sélectionné.');
      removeFile();
    }
  };

  const removeFile = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Fichier supprimé.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur d\'authentification',
        description: 'Vous devez être connecté pour importer un modèle.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.airport || !selectedFile || !formData.company_code || !formData.document_type_code || !formData.department_code || !formData.language_code) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir tous les champs obligatoires (Titre, Aéroport, Type de document, Département, Langue, et sélectionner un fichier).',
        variant: 'destructive',
      });
      return;
    }

    console.log('Tentative d\'upload du fichier:', selectedFile);
    console.log('Données du formulaire:', formData);

    const uploadedFile = await uploadTemplate(selectedFile, {
      allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      maxSize: 10
    });

    if (uploadedFile) {
      console.log('Fichier uploadé avec succès:', uploadedFile);

      // Map 'GEN' to 'GENERALE' for the backend enum
      const mappedAirport = formData.airport === 'GEN' ? 'GENERALE' : formData.airport;

      createTemplate({
        title: formData.title,
        content: formData.description,
        airport: mappedAirport, // Use the mapped airport value
        file_path: uploadedFile.path,
        file_type: selectedFile.type,
        company_code: formData.company_code,
        scope_code: formData.airport, // scope_code still uses 'GEN' for code generation
        department_code: formData.department_code,
        sub_department_code: formData.sub_department_code,
        document_type_code: formData.document_type_code,
        language_code: formData.language_code,
      }, {
        onSuccess: () => {
          toast({
            title: 'Modèle importé',
            description: 'Le modèle a été importé et enregistré avec succès.',
          });
          // Reset form
          setFormData({
            title: '',
            airport: user?.airport || 'ENFIDHA',
            description: '',
            company_code: 'TAVTUN',
            document_type_code: undefined,
            department_code: undefined,
            sub_department_code: undefined,
            language_code: 'FR',
          });
          removeFile();
          console.log('Modèle créé et formulaire réinitialisé.');
        }
      });
    } else {
      console.log('L\'upload du fichier a échoué, annulation de la création du modèle.');
    }
  };

  if (isLoadingCodeConfig) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de la configuration des codes documentaires...</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FilePlus className="w-5 h-5 mr-2 text-aviation-sky" />
          Importer un nouveau modèle
        </CardTitle>
        <CardDescription>
          Téléchargez un fichier pour l'utiliser comme modèle de document.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="template-title">Titre du modèle *</Label>
              <Input
                id="template-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Modèle de rapport mensuel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_code">Code Société *</Label>
              <Input
                id="company_code"
                value={formData.company_code}
                onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                placeholder="Ex: TAVTUN"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-airport">Aéroport (Scope) *</Label>
              <Select
                value={formData.airport}
                onValueChange={(value: Airport) => setFormData({ ...formData, airport: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un aéroport" />
                </SelectTrigger>
                <SelectContent>
                  {codeConfig?.scopes.map(scope => (
                    <SelectItem key={scope.code} value={scope.code}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type_code">Type de document (pour modèle) *</Label>
              <Select
                value={formData.document_type_code}
                onValueChange={(value: string) => setFormData({ ...formData, document_type_code: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {codeConfig?.documentTypes.map(docType => (
                    <SelectItem key={docType.code} value={docType.code}>
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_code">Département *</Label>
              <Select
                value={formData.department_code}
                onValueChange={(value: string) => setFormData({ ...formData, department_code: value })}
                required
                disabled={!!user?.department && formData.department_code === initialDepartmentCode && initialDepartmentCode !== undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {codeConfig?.departments.map(dept => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.department && initialDepartmentCode !== undefined && (
                <p className="text-xs text-gray-500">
                  Département pré-réglé ({user.department})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_department_code">Sous-département (optionnel)</Label>
              <Select
                value={formData.sub_department_code}
                onValueChange={(value: string) => setFormData({ ...formData, sub_department_code: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un sous-département" />
                </SelectTrigger>
                <SelectContent>
                  {codeConfig?.subDepartments.map(subDept => (
                    <SelectItem key={subDept.code} value={subDept.code}>
                      {subDept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_code">Langue *</Label>
              <Select
                value={formData.language_code}
                onValueChange={(value: string) => setFormData({ ...formData, language_code: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {codeConfig?.languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview of the generated code for the template */}
          <div className="space-y-2">
            <Label>Prévisualisation du Code Modèle</Label>
            <Input
              value={previewTemplateCode}
              readOnly
              className="font-mono bg-gray-100 text-gray-700"
            />
            <p className="text-xs text-gray-500">
              Ce code sera utilisé comme base pour les documents créés à partir de ce modèle.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description (optionnel)</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du modèle et de son utilisation..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Fichier du modèle *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Glissez-déposez votre fichier ici ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formats supportés: PDF, Word, Excel, PowerPoint (max 10MB)
              </p>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                className="hidden"
                id="template-file-upload"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Sélectionner un fichier
              </Button>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {previewUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => {
              setFormData({
                title: '',
                airport: user?.airport || 'ENFIDHA',
                description: '',
                company_code: 'TAVTUN',
                document_type_code: undefined,
                department_code: undefined,
                sub_department_code: undefined,
                language_code: 'FR',
              });
              removeFile();
            }}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUploadingFile || !formData.title.trim() || !formData.airport || !selectedFile || !formData.document_type_code || !formData.department_code || !formData.language_code}
              className="bg-aviation-sky hover:bg-aviation-sky-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating || isUploadingFile ? 'Import...' : 'Importer le modèle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};