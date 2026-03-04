import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import { Airport } from '@/shared/types';

interface GeneralSettingsSectionProps {
  formData: {
    company_name: string;
    default_airport: Airport;
    language: string;
    theme: string;
  };
  updateSetting: (key: string, value: any) => void;
  isUpdating: boolean;
}

export const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  formData,
  updateSetting,
  isUpdating,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2" />
          Paramètres Généraux
        </CardTitle>
        <CardDescription>
          Configuration générale de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nom de l'organisation</Label>
          <Input
            id="companyName"
            value={formData.company_name}
            onChange={(e) => updateSetting('company_name', e.target.value)}
            disabled={isUpdating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultAirport">Aéroport par défaut</Label>
          <Select
            value={formData.default_airport}
            onValueChange={(value: Airport) => updateSetting('default_airport', value)}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENFIDHA">Enfidha</SelectItem>
              <SelectItem value="MONASTIR">Monastir</SelectItem>
              <SelectItem value="GENERALE">Général</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Langue</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => updateSetting('language', value)}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Thème</Label>
          <Select
            value={formData.theme}
            onValueChange={(value) => updateSetting('theme', value)}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="auto">Automatique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};