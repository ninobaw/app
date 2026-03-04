import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';

interface SecuritySettingsSectionProps {
  formData: {
    session_timeout: number;
    require_two_factor: boolean;
    password_expiry: number;
  };
  updateSetting: (key: string, value: any) => void;
  isUpdating: boolean;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  formData,
  updateSetting,
  isUpdating,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Sécurité
        </CardTitle>
        <CardDescription>
          Configuration de la sécurité et des accès
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={formData.session_timeout}
            onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Authentification à deux facteurs</Label>
            <p className="text-sm text-gray-500">
              Exiger l'A2F pour tous les utilisateurs
            </p>
          </div>
          <Switch
            checked={formData.require_two_factor}
            onCheckedChange={(checked) => updateSetting('require_two_factor', checked)}
            disabled={isUpdating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordExpiry">Expiration des mots de passe (jours)</Label>
          <Input
            id="passwordExpiry"
            type="number"
            value={formData.password_expiry}
            onChange={(e) => updateSetting('password_expiry', parseInt(e.target.value))}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
};