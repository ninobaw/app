import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DOCUMENT_TEMPLATES, DOCUMENT_CATEGORIES } from '@/constants/documentTemplates';

type TemplateCategory = keyof typeof DOCUMENT_CATEGORIES;

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: TemplateCategory;
}

export function DocumentCreator({ onDocumentCreated }: { onDocumentCreated?: (document: any) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  // Organiser les modèles par catégorie
  const templatesByCategory = Object.entries(DOCUMENT_TEMPLATES).reduce<Record<string, TemplateOption[]>>(
    (acc, [id, template]) => {
      const category = template.category || 'AUTRE';
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push({
        id,
        name: template.name,
        description: template.description,
        icon: getIconForExtension(template.extension),
        category: template.category
      });
      
      return acc;
    },
    {}
  );

  const handleCreateDocument = async () => {
    if (!selectedTemplate || !user) return;

    setIsCreating(true);
    
    try {
      const template = DOCUMENT_TEMPLATES[selectedTemplate];
      const metadata = {
        ...customFields,
        reference: customFields.reference || `REF-${Date.now()}`,
        createdBy: `${user.firstName} ${user.lastName}`,
        createdByEmail: user.email,
        department: user.department || 'GENERAL'
      };

      // Obtenir le token JWT depuis localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Créer le document via l'API backend
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: metadata.reference || `${template.name} - ${Date.now()}`,
          type: template.category || 'GENERAL',
          content: '',
          status: 'DRAFT',
          airport: user.department === 'ENFIDHA' ? 'ENFIDHA' : user.department === 'MONASTIR' ? 'MONASTIR' : 'GENERALE',
          metadata: {
            ...metadata,
            templateId: selectedTemplate,
            extension: template.extension
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du document');
      }

      const result = await response.json();
      const document = result.data;

      // Rediriger vers l'éditeur OnlyOffice
      navigate(`/documents/edit-onlyoffice/${document._id}`);
      
      // Appeler le callback si fourni
      if (onDocumentCreated) {
        onDocumentCreated(document);
      }
      
      setIsOpen(false);
      
      toast({
        title: "Document créé",
        description: `Le document "${document.title}" a été créé avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du document.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Réinitialiser les champs personnalisés
    setCustomFields({});
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedTemplateData = selectedTemplate ? DOCUMENT_TEMPLATES[selectedTemplate] : null;
  const requiredFields = selectedTemplateData?.metadata?.requiredFields || [];
  const isFormValid = selectedTemplate && 
    requiredFields.every((field: string) => 
      field === 'reference' || // La référence peut être générée automatiquement
      (customFields[field] && customFields[field].trim() !== '')
    );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau document
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Créer un nouveau document</DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle pour commencer. Vous pourrez le personnaliser par la suite.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-6 py-4">
          {/* Liste des modèles par catégorie */}
          <div className="col-span-4 border-r pr-4">
            <div className="space-y-4">
              {Object.entries(DOCUMENT_CATEGORIES).map(([categoryId, categoryName]) => {
                const templates = templatesByCategory[categoryId] || [];
                if (templates.length === 0) return null;
                
                return (
                  <div key={categoryId} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{categoryName}</h3>
                    <div className="space-y-1">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm ${
                            selectedTemplate === template.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground">{template.icon}</span>
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Aperçu et champs personnalisés */}
          <div className="col-span-8">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{selectedTemplateData?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateData?.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {requiredFields.map((field: string) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>
                        {formatFieldName(field)}
                        {field !== 'reference' && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      
                      {field === 'department' ? (
                        <Select
                          value={customFields[field] || ''}
                          onValueChange={value => handleCustomFieldChange(field, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un département" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUALITE">Qualité</SelectItem>
                            <SelectItem value="EXPLOITATION">Exploitation</SelectItem>
                            <SelectItem value="SECURITE">Sécurité</SelectItem>
                            <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field}
                          value={customFields[field] || ''}
                          onChange={e => handleCustomFieldChange(field, e.target.value)}
                          placeholder={`Entrez ${formatFieldName(field).toLowerCase()}`}
                        />
                      )}
                      
                      {field === 'reference' && (
                        <p className="text-xs text-muted-foreground">
                          Laissé vide pour générer une référence automatique
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Sélectionnez un modèle pour commencer</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateDocument}
            disabled={!isFormValid || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer le document'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Fonction utilitaire pour formater les noms de champs
function formatFieldName(field: string): string {
  return field
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Fonction utilitaire pour obtenir l'icône en fonction de l'extension
function getIconForExtension(extension: string): React.ReactNode {
  switch (extension) {
    case 'docx':
    case 'doc':
    case 'odt':
      return <FileText className="h-4 w-4" />;
    case 'xlsx':
    case 'xls':
    case 'ods':
      return <FileSpreadsheet className="h-4 w-4" />;
    case 'pptx':
    case 'ppt':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}
