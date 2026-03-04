import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CorrespondenceStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface CorrespondenceStatusDistributionProps {
  data?: CorrespondenceStatusData[];
  isLoading?: boolean;
}

const STATUS_COLORS = {
  'PENDING': '#f59e0b', // amber-500
  'REPLIED': '#10b981', // emerald-500
  'INFORMATIF': '#3b82f6', // blue-500
  'DRAFT': '#6b7280' // gray-500
};

const STATUS_LABELS = {
  'PENDING': 'En Attente',
  'REPLIED': 'Répondu',
  'INFORMATIF': 'Informatif',
  'DRAFT': 'Brouillon'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{STATUS_LABELS[data.status as keyof typeof STATUS_LABELS] || data.status}</p>
        <p className="text-sm text-gray-600">
          {data.count} correspondances ({data.percentage.toFixed(1)}%)
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Cliquez pour voir les correspondances
        </p>
      </div>
    );
  }
  return null;
};

export const CorrespondenceStatusDistribution = ({ 
  data = [], 
  isLoading = false 
}: CorrespondenceStatusDistributionProps) => {
  const navigate = useNavigate();

  // Fonction pour naviguer vers la page des correspondances avec filtre
  const handleStatusClick = (status: string) => {
    navigate(`/correspondances?status=${status}`);
  };

  // Fonction pour gérer le clic sur une section du graphique
  const handlePieClick = (data: any) => {
    if (data && data.status) {
      handleStatusClick(data.status);
    }
  };

  // Composant de légende personnalisé avec navigation
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div 
            key={index} 
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={() => handleStatusClick(entry.payload.status)}
            title={`Cliquez pour voir les correspondances ${STATUS_LABELS[entry.payload.status as keyof typeof STATUS_LABELS] || entry.payload.status}`}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 hover:text-gray-900">
              {STATUS_LABELS[entry.payload.status as keyof typeof STATUS_LABELS] || entry.payload.status}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
            Répartition par Statut
          </CardTitle>
          <CardDescription>
            Distribution des correspondances par statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
            Répartition par Statut
          </CardTitle>
          <CardDescription>
            Distribution des correspondances par statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour le graphique
  const chartData = data.map(item => ({
    ...item,
    fill: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#6b7280'
  }));

  const totalCorrespondences = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
          Répartition par Statut
        </CardTitle>
        <CardDescription>
          Distribution des {totalCorrespondences} correspondances par statut • Cliquez pour filtrer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistiques détaillées avec navigation */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item) => (
            <div 
              key={item.status} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleStatusClick(item.status)}
              title={`Cliquez pour voir les correspondances ${STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status}`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#6b7280' }}
                />
                <span className="text-sm font-medium">
                  {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{item.count}</div>
                <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
