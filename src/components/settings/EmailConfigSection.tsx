import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail } from 'lucide-react';

interface EmailConfigSectionProps {
  formData: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    use_ssl: boolean;
  };
  updateSetting: (key: string, value: any) => void;
  isUpdating: boolean;
}

export const EmailConfigSection: React.FC<EmailConfigSectionProps> = ({
  formData,
  updateSetting,
  isUpdating,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Configuration Email
        </CardTitle>
        <CardDescription>
          Paramètres SMTP pour l'envoi d'emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">Serveur SMTP</Label>
            <Input
              id="smtpHost"
              value={formData.smtp_host}
              onChange={(e) => updateSetting('smtp_host', e.target.value)}
              placeholder="smtp.office365.com"
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpPort">Port SMTP</Label>
            <Input
              id="smtpPort"
              type="number"
              value={formData.smtp_port}
              onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
              placeholder="587"
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpUsername">Nom d'utilisateur</Label>
            <Input
              id="smtpUsername"
              value={formData.smtp_username}
              onChange={(e) => updateSetting('smtp_username', e.target.value)}
              placeholder="abdallah.benkhalifa@tav.aero"
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="space-y-0.5">
              <Label>Utiliser SSL</Label>
              <p className="text-sm text-gray-500">
                Connexion sécurisée SSL/TLS
              </p>
            </div>
            <Switch
              checked={formData.use_ssl}
              onCheckedChange={(checked) => updateSetting('use_ssl', checked)}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};