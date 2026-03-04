import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Save, 
  Code, 
  Tag,
  TagIcon,
  Palette,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { AppLayout } from '@/components/layout/AppLayout';
import { GeneralSettingsSection } from '@/components/settings/GeneralSettingsSection';
import { SecuritySettingsSection } from '@/components/settings/SecuritySettingsSection';
import TagManagementSection from '@/components/settings/TagManagementSection';
import { DeadlineTypeManagementSection } from '@/components/settings/DeadlineTypeManagementSection';
import { useCreateTag, getTagColors } from '@/hooks/useTags';
import { Airport } from '@/shared/types';
import { DocumentCodeConfigManagement } from '@/components/settings/DocumentCodeConfigManagement';
import { DocumentSettingsSection } from '@/components/settings/DocumentSettingsSection';
import { EmailConfigSection } from '@/components/settings/EmailConfigSection';
import { SmsConfigSection } from '@/components/settings/SmsConfigSection';
import { CorrespondanceAssignmentFixer } from '@/components/admin/CorrespondanceAssignmentFixer';
import { useTagDialogStore } from '@/hooks/useTagDialogStore';

// Créer le dialogue de création des tags avec le store
const CreateTagDialog: React.FC = () => {
  const { isOpen, close } = useTagDialogStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [description, setDescription] = useState('');

  const createTag = useCreateTag();
  const tagColors = getTagColors();

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('SettingsPage CreateTagDialog: Dialog opened, resetting form');
      setName('');
      setColor('#3B82F6');
      setDescription('');
    }
  }, [isOpen]);

  const handleCreateTag = React.useCallback(async () => {
    console.log('SettingsPage CreateTagDialog: handleCreateTag called with:', { name: name.trim(), color, description });

    if (!name.trim()) {
      toast.error('Le nom du tag est requis');
      return;
    }

    try {
      console.log('SettingsPage CreateTagDialog: Starting tag creation...');
      const result = await createTag.mutateAsync({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      });

      console.log('SettingsPage CreateTagDialog: Tag created successfully:', result);
      // Reset form
      setName('');
      setColor('#3B82F6');
      setDescription('');
      close();
    } catch (error) {
      console.error('SettingsPage CreateTagDialog: Error creating tag:', error);
    }
  }, [name, color, description, createTag, close]);

  // Simplified close handler - only close when explicitly requested
  const handleDialogClose = React.useCallback((newOpen: boolean) => {
    console.log('SettingsPage CreateTagDialog: Dialog close requested:', newOpen);
    if (!newOpen) {
      close();
    }
  }, [close]);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Créer un nouveau tag
          </DialogTitle>
          <DialogDescription>
            Créez un tag prédéfini qui sera disponible pour toutes les correspondances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nom du tag *</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: urgent, important, confidentiel..."
              maxLength={50}
              disabled={createTag.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-color">Couleur</Label>
            <Select value={color} onValueChange={setColor} disabled={createTag.isPending}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    {tagColors.find(c => c.value === color)?.label || 'Couleur personnalisée'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tagColors.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorOption.value }}
                      />
                      {colorOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-description">Description (optionnelle)</Label>
            <Textarea
              id="tag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du tag..."
              maxLength={200}
              rows={3}
              disabled={createTag.isPending}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Palette className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Aperçu :</span>
            <Badge
              style={{
                backgroundColor: color + '20',
                color: color,
                borderColor: color + '40'
              }}
              className="border"
            >
              {name || 'Nom du tag'}
            </Badge>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={createTag.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreateTag}
              disabled={createTag.isPending || !name.trim()}
            >
              {createTag.isPending ? 'Création...' : 'Créer le tag'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SettingsPage: React.FC = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings(); 
  const { hasPermission, user } = useAuth();

  // Debug: Log when SettingsPage re-renders
  console.log('SettingsPage: Rendering at', new Date().toLocaleTimeString());

  const [formData, setFormData] = useState({
    company_name: '',
    default_airport: 'ENFIDHA' as Airport,
    language: 'fr',
    theme: 'light',
    session_timeout: 60,
    require_two_factor: false,
    password_expiry: 90,
    document_retention: 365,
    auto_archive: true,
    max_file_size: 10,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    use_ssl: true,
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
  });

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        default_airport: settings.default_airport || 'ENFIDHA',
        language: settings.language || 'fr',
        theme: settings.theme || 'light',
        session_timeout: settings.session_timeout || 60,
        require_two_factor: settings.require_two_factor ?? false,
        password_expiry: settings.password_expiry || 90,
        document_retention: settings.document_retention || 365,
        auto_archive: settings.auto_archive ?? true,
        max_file_size: settings.max_file_size || 10,
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || '',
        use_ssl: settings.use_ssl ?? true,
        twilio_account_sid: settings.twilio_account_sid || '',
        twilio_auth_token: settings.twilio_auth_token || '',
        twilio_phone_number: settings.twilio_phone_number || '',
      });
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const canManageSettings = hasPermission('manage_settings');
  const canManageTags = hasPermission('manage_tags');

  // Debug: Log permissions
  console.log('SettingsPage: Permissions - canManageSettings:', canManageSettings, 'canManageTags:', canManageTags);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 mt-1">
            Configurer les paramètres de l'application
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4" />
              <span>Général</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Sécurité</span>
            </TabsTrigger>
            {canManageSettings && (
              <TabsTrigger value="document-codes" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Codes Doc</span>
              </TabsTrigger>
            )}
            {canManageTags && (
              <TabsTrigger value="tags" className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </TabsTrigger>
            )}
            {user?.role === 'SUPER_ADMIN' && (
              <TabsTrigger value="deadline-types" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Échéances</span>
              </TabsTrigger>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'DIRECTEUR_GENERAL') && (
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Onglets avec formulaire pour les paramètres généraux */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GeneralSettingsSection
                  formData={{
                    company_name: formData.company_name,
                    default_airport: formData.default_airport,
                    language: formData.language,
                    theme: formData.theme,
                  }}
                  onInputChange={handleInputChange}
                  isUpdating={isUpdating}
                />
                <EmailConfigSection
                  formData={{
                    smtp_host: formData.smtp_host,
                    smtp_port: formData.smtp_port,
                    smtp_username: formData.smtp_username,
                    use_ssl: formData.use_ssl,
                  }}
                  onInputChange={handleInputChange}
                  isUpdating={isUpdating}
                />
              </div>
              <SmsConfigSection
                formData={{
                  twilio_account_sid: formData.twilio_account_sid,
                  twilio_auth_token: formData.twilio_auth_token,
                  twilio_phone_number: formData.twilio_phone_number,
                }}
                onInputChange={handleInputChange}
                isUpdating={isUpdating}
              />
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-aviation-sky hover:bg-aviation-sky-dark"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <form onSubmit={handleSave} className="space-y-6">
              <SecuritySettingsSection
                formData={{
                  session_timeout: formData.session_timeout,
                  require_two_factor: formData.require_two_factor,
                  password_expiry: formData.password_expiry,
                }}
                onInputChange={handleInputChange}
                isUpdating={isUpdating}
              />
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-aviation-sky hover:bg-aviation-sky-dark"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Onglets sans formulaire pour éviter la sauvegarde automatique */}
          {canManageSettings && (
            <TabsContent value="document-codes" className="space-y-6 mt-6">
              <DocumentCodeConfigManagement />
            </TabsContent>
          )}

          {canManageTags && (
            <TabsContent value="tags" className="space-y-6 mt-6">
              <TagManagementSection />
            </TabsContent>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <TabsContent value="deadline-types" className="space-y-6 mt-6">
              <DeadlineTypeManagementSection />
            </TabsContent>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'DIRECTEUR_GENERAL') && (
            <TabsContent value="admin" className="space-y-6 mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Administration des Correspondances</CardTitle>
                    <CardDescription>
                      Outils d'administration pour la gestion des correspondances et des assignations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CorrespondanceAssignmentFixer />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <CreateTagDialog />
    </AppLayout>
  );
};

export default SettingsPage;
