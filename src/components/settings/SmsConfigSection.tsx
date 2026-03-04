import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface SmsConfigSectionProps {
  formData: {
    twilio_account_sid: string;
    twilio_auth_token: string;
    twilio_phone_number: string;
  };
  updateSetting: (key: string, value: any) => void;
  isUpdating: boolean;
}

export const SmsConfigSection: React.FC<SmsConfigSectionProps> = ({
  formData,
  updateSetting,
  isUpdating,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Configuration SMS (Twilio)
        </CardTitle>
        <CardDescription>
          Paramètres pour l'envoi de notifications SMS via Twilio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="twilioAccountSid">Account SID</Label>
            <Input
              id="twilioAccountSid"
              value={formData.twilio_account_sid}
              onChange={(e) => updateSetting('twilio_account_sid', e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilioAuthToken">Auth Token</Label>
            <Input
              id="twilioAuthToken"
              type="password"
              value={formData.twilio_auth_token}
              onChange={(e) => updateSetting('twilio_auth_token', e.target.value)}
              placeholder="your_auth_token"
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilioPhoneNumber">Numéro de téléphone Twilio</Label>
            <Input
              id="twilioPhoneNumber"
              value={formData.twilio_phone_number}
              onChange={(e) => updateSetting('twilio_phone_number', e.target.value)}
              placeholder="+1234567890"
              disabled={isUpdating}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Ces informations sont nécessaires pour envoyer des SMS via Twilio. Vous pouvez les trouver sur votre tableau de bord Twilio.
        </p>
      </CardContent>
    </Card>
  );
};