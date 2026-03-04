import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Airport } from '@/shared/types';
import { useDocumentCodeConfig } from '@/hooks/useDocumentCodeConfig';
import { generateDocumentCodePreview, mapDocumentTypeCodeToDocumentTypeEnum } from '@/shared/utils';
import { useTemplates } from '@/hooks/useTemplates'; // Import useTemplates

export const DocumentCreationForm: React.FC = () => {
  const { user } = useAuth();
  const { createDocument, isCreating } = useDocuments();
  const { config: codeConfig } = useDocumentCodeConfig();
  const { templates, isLoading: isLoadingTemplates } = useTemplates(); // Fetch templates
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialDepartmentCode = useMemo(() => {
    if (user && codeConfig?.departments) {
      const foundDept = codeConfig.departments.find(d => d.label === user.department);
      return foundDept ? foundDept.code : undefined;
    }
    return undefined;
  }, [user, codeConfig]);

  const [formData, setFormData] = useState({
    title: '',
    company_code: 'TAVTUN',
    airport: undefined as Airport | undefined,
    department_code: undefined as string | undefined,
    sub_department_code: undefined as string | undefined,
    document_type_code: undefined as string | undefined,
    language_code: undefined as string | undefined,
    version: 'REV:0', // Initial version for new documents
    description: '',
    content: ''
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null); // New state for selected template

  useEffect(() => {
    if (user && codeConfig) {
      const defaultAirport = user.airport || 'ENFIDHA';
      const defaultLanguage = 'FR';

      setFormData(prev => ({
        ...prev,
        airport: defaultAirport,
        department_code: initialDepartmentCode,
        language_code: defaultLanguage,
      }));
    }
  }, [user, codeConfig, initialDepartmentCode]);

  const previewQrCodeForm = useMemo(() => {
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.content || '', // Use template's content for description
        content: template.content || '', // Use template's content for main content
        airport: template.airport,
        document_type_code: template.document_type_code || undefined,
        department_code: template.department_code || initialDepartmentCode, // Keep user's department if template doesn't specify
        sub_department_code: template.sub_department_code || undefined,
        language_code: template.language_code || 'FR',
      }));
      toast({
        title: 'Modèle chargé',
        description: `Le modèle "${template.title}" a été chargé dans le formulaire.`,
        variant: 'info', // Changed to info
      });
    } else {
      // If "Aucun modèle" is selected or template not found, clear relevant fields
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        content: '',
        // Reset codification fields to defaults or user's department
        airport: user?.airport || 'ENFIDHA',
        document_type_code: undefined,
        department_code: initialDepartmentCode,
        sub_department_code: undefined,
        language_code: 'FR',
      }));
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur d\'authentification',
        description: 'Vous devez être connecté pour créer un document.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.airport || !formData.document_type_code || !formData.department_code || !formData.language_code) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir tous les champs obligatoires (Titre, Aéroport, Type de document, Département, Langue).',
        variant: 'destructive',
      });
      return;
    }

    const documentData = {
      title: formData.title,
      content: formData.content,
      type: mapDocumentTypeCodeToDocumentTypeEnum(formData.document_type_code!),
      airport: formData.airport!,
      company_code: formData.company_code,
      scope_code: codeConfig?.scopes.find(s => s.code === formData.airport)?.code || formData.airport,
      department_code: formData.department_code!,
      sub_department_code: formData.sub_department_code || undefined,
      document_type_code: formData.document_type_code!,
      language_code: formData.language_code!,
      version: 0,
    };

    createDocument(documentData, {
      onSuccess: () => {
        toast({
          title: 'Document créé',
          description: 'Le document a été créé avec succès.',
          variant: 'success',
        });
        navigate('/documents');
      }
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="select-template">Charger depuis un modèle</Label>
        <Select
          value={selectedTemplateId || ''}
          onValueChange={handleTemplateSelect}
          disabled={isLoadingTemplates}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un modèle existant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Aucun modèle --</SelectItem>
            {templates.length === 0 ? (
              <SelectItem value="no-templates" disabled>Aucun modèle disponible</SelectItem>
            ) : (
              templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.title} ({template.airport} - {template.document_type_code})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Sélectionnez un modèle pour pré-remplir les champs du document.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Titre du document *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Entrez le titre du document"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_code">Code Société</Label>
          <Input
            id="company_code"
            value={formData.company_code}
            onChange={(e) => setFormData(prev => ({ ...prev, company_code: e.target.value }))}
            placeholder="Ex: TAVTUN"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aeroport">Aéroport (Scope) *</Label>
          <Select 
            value={formData.airport}
            onValueChange={(value: Airport) => setFormData(prev => ({ ...prev, airport: value }))}
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
          <Label htmlFor="document_type_code">Type de document *</Label>
          <Select
            value={formData.document_type_code}
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, document_type_code: value }))}
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
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, department_code: value }))}
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
              Département pré-rempli ({user.department})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sub_department_code">Sous-département</Label>
          <Select
            value={formData.sub_department_code}
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, sub_department_code: value }))}
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
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, language_code: value }))}
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

      {/* Document Code Preview for Form */}
      <div className="space-y-2">
        <Label>Prévisualisation du Code Documentaire</Label>
        <Input
          value={previewQrCodeForm}
          readOnly
          className="font-mono bg-gray-100 text-gray-700"
        />
        <p className="text-xs text-gray-500">
          Ce code sera généré automatiquement lors de la sauvegarde.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="version">Version</Label>
        <Input
          id="version"
          value={formData.version}
          readOnly
          className="bg-gray-100"
        />
        <p className="text-xs text-gray-500">
          La version initiale d'un nouveau document est toujours REV:0.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description détaillée du document..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenu du document</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Saisissez le contenu complet du document..."
          rows={8}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => navigate('/documents')}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isCreating}
          className="bg-aviation-sky hover:bg-aviation-sky-dark"
        >
          <Save className="w-4 h-4 mr-2" />
          {isCreating ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};