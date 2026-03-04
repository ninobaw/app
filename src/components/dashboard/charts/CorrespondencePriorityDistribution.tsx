import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRIORITIES } from '@/shared/constants';

interface CorrespondencePriorityDistributionProps {
  data: { name: string; value: number }[];
  isLoading: boolean;
}

const COLORS = {
  LOW: '#6B7280', // gray-500
  MEDIUM: '#F59E0B', // amber-500
  HIGH: '#EF4444', // red-500
  URGENT: '#DC2626', // red-600
};

const PRIORITY_LABELS = {
  'LOW': 'Faible',
  'MEDIUM': 'Moyenne',
  'HIGH': 'Élevée',
  'URGENT': 'Urgent'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">
          {payload[0].value} correspondances
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Cliquez pour voir les correspondances
        </p>
      </div>
    );
  }
  return null;
};

export const CorrespondencePriorityDistribution: React.FC<CorrespondencePriorityDistributionProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  // Fonction pour naviguer vers la page des correspondances avec filtre priorité
  const handlePriorityClick = (priority: string) => {
    // Trouver la priorité originale basée sur le label affiché
    const originalPriority = data.find(item => {
      const label = PRIORITIES[item.name as keyof typeof PRIORITIES]?.label || item.name;
      return label === priority;
    })?.name || priority;
    
    navigate(`/correspondances?priority=${originalPriority}`);
  };

  // Fonction pour gérer le clic sur une barre du graphique
  const handleBarClick = (data: any) => {
    if (data && data.name) {
      handlePriorityClick(data.name);
    }
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

  const formattedData = data.map(item => ({
    name: PRIORITIES[item.name as keyof typeof PRIORITIES]?.label || item.name,
    value: item.value,
    color: COLORS[item.name as keyof typeof COLORS] || '#6B7280',
    originalName: item.name, // Garder le nom original pour la navigation
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="w-5 h-5 mr-2 text-aviation-sky" />
          Correspondances par Priorité
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Cliquez sur une barre pour filtrer</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={formattedData} 
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="name" className="text-sm text-gray-600" />
            <YAxis allowDecimals={false} className="text-sm text-gray-600" />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#0EA5E9"
              style={{ cursor: 'pointer' }}
              onClick={handleBarClick}
            >
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handlePriorityClick(entry.name)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};