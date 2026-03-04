import React, { useEffect, useState } from 'react';

interface CarGaugeProgressProps {
  progress: number; // 0-100
  total: number;
  current: number;
  title: string;
  isComplete?: boolean;
}

export const CarGaugeProgress: React.FC<CarGaugeProgressProps> = ({ 
  progress, 
  total, 
  current, 
  title, 
  isComplete = false 
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Calculer l'angle pour la jauge (180 degrés = demi-cercle)
  const angle = (animatedProgress / 100) * 180;
  const rotation = angle - 90; // Commencer à -90 degrés (position 9h)

  // Couleur basée sur le progrès
  const getColor = () => {
    if (isComplete) return '#22c55e'; // Vert
    if (progress < 30) return '#ef4444'; // Rouge
    if (progress < 70) return '#f59e0b'; // Orange
    return '#3b82f6'; // Bleu
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg">
      {/* Titre */}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      
      {/* Jauge circulaire */}
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Fond de la jauge */}
        <div className="absolute inset-0">
          <svg width="192" height="96" viewBox="0 0 192 96" className="transform">
            {/* Cercle de fond */}
            <path
              d="M 16 80 A 80 80 0 0 1 176 80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Cercle de progression */}
            <path
              d="M 16 80 A 80 80 0 0 1 176 80"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(animatedProgress / 100) * 251.2} 251.2`}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 6px ${color}40)`
              }}
            />
          </svg>
        </div>

        {/* Aiguille */}
        <div className="absolute inset-0 flex items-end justify-center">
          <div 
            className="w-1 h-16 bg-gray-800 rounded-full origin-bottom transition-transform duration-500 ease-out"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'bottom center'
            }}
          >
            {/* Pointe de l'aiguille */}
            <div className="w-3 h-3 bg-gray-800 rounded-full -mt-1 -ml-1"></div>
          </div>
        </div>

        {/* Centre de la jauge */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-800 rounded-full border-2 border-white shadow-lg"></div>
      </div>

      {/* Affichage numérique */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold" style={{ color }}>
          {Math.round(animatedProgress)}%
        </div>
        <div className="text-sm text-gray-600">
          {current} / {total} correspondances
        </div>
        {isComplete && (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Terminé !</span>
          </div>
        )}
      </div>

      {/* Indicateurs de vitesse (optionnel) */}
      <div className="flex space-x-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-1 rounded-full transition-colors duration-300 ${
              i < (animatedProgress / 10) ? 'bg-current' : 'bg-gray-300'
            }`}
            style={{ color }}
          />
        ))}
      </div>
    </div>
  );
};
