import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Activity,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { CreateReportDialog } from '@/components/reports/CreateReportDialog';
import { ReportsList } from '@/components/reports/ReportsList';

const Reports = () => {
  const { reports, isLoading, deleteReport, isDeleting } = useReports();

  const reportStats = [
    {
      title: 'Rapports Générés',
      value: reports.length.toString(),
      change: '+2',
      trend: 'up',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Rapports Complétés',
      value: reports.filter(r => r.status === 'COMPLETED').length.toString(),
      change: '+1',
      trend: 'up',
      icon: Target,
      color: 'green'
    },
    {
      title: 'En Cours',
      value: reports.filter(r => r.status === 'PENDING').length.toString(),
      change: '0',
      trend: 'neutral',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Types Différents',
      value: new Set(reports.map(r => r.type)).size.toString(),
      change: '+1',
      trend: 'up',
      icon: Activity,
      color: 'purple'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports et Statistiques</h1>
            <p className="text-gray-500 mt-1">
              Analysez les données et générez des rapports avec les données réelles
            </p>
          </div>
          <CreateReportDialog />
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {reportStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className={`h-4 w-4 mr-1 ${
                        stat.trend === 'up' ? 'text-green-500' : 
                        stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 
                        stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tous les Rapports</TabsTrigger>
            <TabsTrigger value="completed">Complétés</TabsTrigger>
            <TabsTrigger value="pending">En Attente</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tous les Rapports</CardTitle>
                <CardDescription>
                  Liste complète des rapports générés avec les données de la base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsList 
                  reports={reports}
                  isLoading={isLoading}
                  onDelete={deleteReport}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapports Complétés</CardTitle>
                <CardDescription>
                  Rapports générés avec succès et prêts à télécharger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsList 
                  reports={reports.filter(r => r.status === 'COMPLETED')}
                  isLoading={isLoading}
                  onDelete={deleteReport}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapports En Attente</CardTitle>
                <CardDescription>
                  Rapports en cours de génération ou programmés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsList 
                  reports={reports.filter(r => r.status === 'PENDING')}
                  isLoading={isLoading}
                  onDelete={deleteReport}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;