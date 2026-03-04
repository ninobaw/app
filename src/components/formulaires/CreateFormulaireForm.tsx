import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Upload, Eye, Download, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useFormulaires } from '@/hooks/useFormulaires';
import { Airport } from '@/shared/types'; // Import Airport type

interface FormulaireFormData {
  title: string;
  code: string;
  airport: Airport; // Use Airport type
  category: string;
  description: string;
  instructions: string;
}

export const CreateFormulaireForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createFormulaire, isCreating } = useFormulaires();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormulaireFormData>({
    defaultValues: {
      airport: user?.airport || 'ENFIDHA',
      category: '',
      title: '',
      code: '',
      description: '',
      instructions: '',
    }
  });

  const selectedAirport = watch('airport');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const onSubmit = (data: FormulaireFormData) => {
    if (!user) {
      toast({
        title: 'Erreur d\'authentification',
        description: 'Vous devez être connecté pour créer un formulaire.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.title.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Le nom du formulaire est requis.',
        variant: 'destructive',
      });
      return;
    }

    createFormulaire({
      title: data.title.trim(),
      content: data.description || '',
      code: data.code || '',
      airport: data.airport,
      category: data.category || '',
      description: data.description || '',
      instructions: data.instructions || '',
    });

    // Reset form après création réussie
    resetForm();
  };

  const resetForm = () => {
    reset({
      airport: user?.airport || 'ENFIDHA',
      category: '',
      title: '',
      code: '',
      description: '',
      instructions: '',
    });
    removeFile();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2 text-aviation-sky" />
          Nouveau Formulaire Documentaire
        </CardTitle>
        <CardDescription>
          Remplissez les informations et téléchargez un modèle de formulaire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Nom du formulaire *</Label>
              <Input
                id="title"
                placeholder="Entrez le nom du formulaire"
                {...register('title', { required: 'Le nom du formulaire est requis' })}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code formulaire</Label>
              <Input
                id="code"
                placeholder="FORM-2025-001"
                {...register('code')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="airport">Aéroport *</Label>
              <Select value={selectedAirport} onValueChange={(value: Airport) => setValue('airport', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un aéroport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENFIDHA">Enfidha</SelectItem>
                  <SelectItem value="MONASTIR">Monastir</SelectItem>
                  <SelectItem value="GENERALE">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="securite">Sécurité</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="operations">Opérations</SelectItem>
                  <SelectItem value="qualite">Qualité</SelectItem>
                  <SelectItem value="environnement">Environnement</SelectItem>
                  <SelectItem value="rh">Ressources Humaines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du formulaire</Label>
            <Textarea
              id="description"
              placeholder="Description détaillée du formulaire et de son utilisation..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions de remplissage</Label>
            <Textarea
              id="instructions"
              placeholder="Instructions pour remplir correctement ce formulaire..."
              rows={3}
              {...register('instructions')}
            />
          </div>

          {/* Upload Section */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    Télécharger un modèle de formulaire
                  </span>
                  <p className="text-gray-500 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX jusqu'à 10MB
                  </p>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Choisir un fichier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Preview */}
          {uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Fichier téléchargé
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="w-8 h-8 text-aviation-sky" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Visualiser
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = URL.createObjectURL(uploadedFile);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = uploadedFile.name;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-aviation-sky hover:bg-aviation-sky-dark"
              disabled={isCreating}
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Enregistrement...' : 'Enregistrer le formulaire'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};