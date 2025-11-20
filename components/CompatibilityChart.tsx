
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CompatibilityChartProps {
  data: { subject: string; A: number; fullMark: number }[];
  onHoverLabel?: (label: string | null) => void;
}

// Composant personnalisé pour les labels du graphique
const CustomTick = ({ payload, x, y, onHover }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="middle"
        fill="#a0a0a0"
        className="text-[10px] uppercase font-bold cursor-pointer hover:fill-aura-accent transition-colors select-none"
        onMouseEnter={() => onHover && onHover(payload.value)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CompatibilityChart: React.FC<CompatibilityChartProps> = ({ data, onHoverLabel }) => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={<CustomTick onHover={onHoverLabel} />}
          />
          <Radar
            name="Compatibilité"
            dataKey="A"
            stroke="#b06ab3"
            strokeWidth={2}
            fill="#b06ab3"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompatibilityChart;
