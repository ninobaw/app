import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  AlertTriangle, 
  Settings, 
  Save,
  Bell,
  Calendar,
  Timer,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeadlineParameter {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  responseDeadlineDays: number;
  firstReminderDays: number;
  secondReminderDays: number;
  escalationDays: number;
  autoEscalation: boolean;
  notificationEmails: string[];
}

interface DeadlineSettingsData {
  parameters: DeadlineParameter[];
  globalSettings: {
    workingDaysOnly: boolean;
    excludeWeekends: boolean;
    excludeHolidays: boolean;
    businessHoursStart: string;
    businessHoursEnd: string;
    timezone: string;
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    supervisorAlerts: boolean;
    directorAlerts: boolean;
  };
}

export const DeadlineSettings: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<DeadlineSettingsData>({
    parameters: [
      {
        priority: 'URGENT',
        responseDeadlineDays: 1,
        firstReminderDays: 0.5, // 12 heures
        secondReminderDays: 0.75, // 18 heures
        escalationDays: 1.5,
        autoEscalation: true,
        notificationEmails: ['directeur@aeroport.tn', 'superviseur@aeroport.tn']
      },
      {
        priority: 'HIGH',
        responseDeadlineDays: 3,
        firstReminderDays: 1,
        secondReminderDays: 2,
        escalationDays: 4,
        autoEscalation: true,
        notificationEmails: ['superviseur@aeroport.tn']
      },
      {
        priority: 'MEDIUM',
        responseDeadlineDays: 7,
        firstReminderDays: 3,
        secondReminderDays: 5,
        escalationDays: 10,
        autoEscalation: false,
        notificationEmails: ['superviseur@aeroport.tn']
      },
      {
        priority: 'LOW',
        responseDeadlineDays: 14,
        firstReminderDays: 7,
        secondReminderDays: 10,
        escalationDays: 21,
        autoEscalation: false,
        notificationEmails: ['superviseur@aeroport.tn']
      }
    ],
    globalSettings: {
      workingDaysOnly: true,
      excludeWeekends: true,
      excludeHolidays: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '17:00',
      timezone: 'Africa/Tunis'
    },
    notificationSettings: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      supervisorAlerts: true,
      directorAlerts: true
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-blue-500 text-white';
      case 'LOW': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <Zap className="w-4 h-4" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM': return <Clock className="w-4 h-4" />;
      case 'LOW': return <Timer className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const updateParameter = (priority: string, field: keyof DeadlineParameter, value: any) => {
    setSettings(prev => ({
      ...prev,
      parameters: prev.parameters.map(param =>
        param.priority === priority
          ? { ...param, [field]: value }
          : param
      )
    }));
  };

  const updateGlobalSetting = (field: keyof typeof settings.globalSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        [field]: value
      }
    }));
  };

  const updateNotificationSetting = (field: keyof typeof settings.notificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Ici, vous feriez l'appel API pour sauvegarder les paramètres
      // await api.post('/settings/deadline-parameters', settings);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres d'échéances ont été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDays = (days: number) => {
    if (days < 1) {
      return `${Math.round(days * 24)}h`;
    } else if (days === 1) {
      return '1 jour';
    } else {
      return `${days} jours`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Paramètres des Échéances
          </h2>
          <p className="text-gray-600 mt-1">
            Configuration des délais et notifications par priorité de correspondance
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="bg-aviation-sky hover:bg-aviation-sky-dark">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Alerte d'information */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Ces paramètres définissent les délais de réponse et les alertes automatiques pour chaque niveau de priorité.
          Le superviseur recevra des notifications selon ces configurations.
        </AlertDescription>
      </Alert>

      {/* Paramètres par Priorité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.parameters.map((param) => (
          <Card key={param.priority} className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                {getPriorityIcon(param.priority)}
                <Badge className={getPriorityColor(param.priority)}>
                  {param.priority}
                </Badge>
                <span className="text-lg">Correspondances {param.priority.toLowerCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Délai de réponse */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Délai de réponse</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={param.responseDeadlineDays}
                      onChange={(e) => updateParameter(param.priority, 'responseDeadlineDays', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">jours</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Escalade après</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      value={param.escalationDays}
                      onChange={(e) => updateParameter(param.priority, 'escalationDays', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">jours</span>
                  </div>
                </div>
              </div>

              {/* Rappels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">1er rappel</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={param.firstReminderDays}
                      onChange={(e) => updateParameter(param.priority, 'firstReminderDays', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">
                      ({formatDays(param.firstReminderDays)})
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">2ème rappel</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.25"
                      min="0.5"
                      value={param.secondReminderDays}
                      onChange={(e) => updateParameter(param.priority, 'secondReminderDays', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">
                      ({formatDays(param.secondReminderDays)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-escalade */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Escalade automatique</Label>
                <Switch
                  checked={param.autoEscalation}
                  onCheckedChange={(checked) => updateParameter(param.priority, 'autoEscalation', checked)}
                />
              </div>

              {/* Emails de notification */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Emails de notification</Label>
                <div className="flex flex-wrap gap-1">
                  {param.notificationEmails.map((email, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paramètres Globaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Paramètres Globaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Jours ouvrables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Jours ouvrables uniquement</Label>
                <Switch
                  checked={settings.globalSettings.workingDaysOnly}
                  onCheckedChange={(checked) => updateGlobalSetting('workingDaysOnly', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exclure les week-ends</Label>
                <Switch
                  checked={settings.globalSettings.excludeWeekends}
                  onCheckedChange={(checked) => updateGlobalSetting('excludeWeekends', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exclure les jours fériés</Label>
                <Switch
                  checked={settings.globalSettings.excludeHolidays}
                  onCheckedChange={(checked) => updateGlobalSetting('excludeHolidays', checked)}
                />
              </div>
            </div>

            {/* Heures de travail */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Début journée</Label>
                <Input
                  type="time"
                  value={settings.globalSettings.businessHoursStart}
                  onChange={(e) => updateGlobalSetting('businessHoursStart', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Fin journée</Label>
                <Input
                  type="time"
                  value={settings.globalSettings.businessHoursEnd}
                  onChange={(e) => updateGlobalSetting('businessHoursEnd', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Fuseau horaire</Label>
                <Select
                  value={settings.globalSettings.timezone}
                  onValueChange={(value) => updateGlobalSetting('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Tunis">Tunis (GMT+1)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Notifications email</Label>
                <Switch
                  checked={settings.notificationSettings.emailEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('emailEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Notifications SMS</Label>
                <Switch
                  checked={settings.notificationSettings.smsEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('smsEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Notifications push</Label>
                <Switch
                  checked={settings.notificationSettings.pushEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('pushEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Alertes superviseur</Label>
                <Switch
                  checked={settings.notificationSettings.supervisorAlerts}
                  onCheckedChange={(checked) => updateNotificationSetting('supervisorAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Alertes directeur</Label>
                <Switch
                  checked={settings.notificationSettings.directorAlerts}
                  onCheckedChange={(checked) => updateNotificationSetting('directorAlerts', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
