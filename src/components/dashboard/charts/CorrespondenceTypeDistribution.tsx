import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CorrespondenceTypeDistributionProps {
  data: { name: string; value: number }[];
  isLoading: boolean;
}

const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981']; // Tailwind colors

const TYPE_LABELS = {
  'INCOMING': 'Entrante',
  'OUTGOING': 'Sortante'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value} correspondances
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Cliquez pour voir les correspondances
        </p>
      </div>
    );
  }
  return null;
};

export const CorrespondenceTypeDistribution: React.FC<CorrespondenceTypeDistributionProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  // Fonction pour naviguer vers la page des correspondances avec filtre type
  const handleTypeClick = (type: string) => {
    // Convertir le label français vers la valeur anglaise
    const typeKey = Object.keys(TYPE_LABELS).find(
      key => TYPE_LABELS[key as keyof typeof TYPE_LABELS] === type
    ) || type;
    navigate(`/correspondances?type=${typeKey}`);
  };

  // Fonction pour gérer le clic sur une section du graphique
  const handlePieClick = (data: any) => {
    if (data && data.name) {
      handleTypeClick(data.name);
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
            onClick={() => handleTypeClick(entry.payload.name)}
            title={`Cliquez pour voir les correspondances ${entry.payload.name}`}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 hover:text-gray-900">
              {entry.payload.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item, index) => ({
    name: item.name === 'INCOMING' ? 'Entrante' : (item.name === 'OUTGOING' ? 'Sortante' : item.name),
    value: item.value,
    originalName: item.name, // Garder le nom original pour la navigation
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
          Correspondances par Type
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Cliquez sur le graphique ou la légende pour filtrer</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {formattedData.map((entry, index) => (
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
      </CardContent>
    </Card>
  );
};