'use client';

import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Line, ResponsiveContainer } from 'recharts';

interface TotalsDataPoint {
  date: string;
  pallets: number;
  co2: number;
}

interface RunningTotalsChartProps {
  data: TotalsDataPoint[];
}

export default function RunningTotalsChart({ data }: RunningTotalsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" /* gray-300 grid */ />
        {/* Date X-axis (labels auto-formatted, may skip some for readability) */}
        <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 12 }} />
        {/* Left Y-axis for pallets (raw count) */}
        <YAxis yAxisId="left" tick={{ fill: '#4B5563', fontSize: 12 }} />
        {/* Right Y-axis for CO2 (tons) */}
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4B5563', fontSize: 12 }} />
        <Tooltip 
          formatter={(value, name) => 
            name.includes('CO₂') ? `${(value as number).toFixed(2)} t CO₂` : `${value} pallets`
          } 
        />
        <Legend />
        {/* Area for cumulative pallets (left axis) */}
        <Area 
          yAxisId="left" 
          type="monotone" 
          dataKey="pallets" 
          name="Pallets (cumulative)" 
          stroke="#16a34a"       /* green-600 line */
          fill="#16a34a"         /* green fill for area */
          fillOpacity={0.3} 
          strokeWidth={2} 
          activeDot={{ r: 4 }} 
        />
        {/* Line for cumulative CO2 (right axis) */}
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="co2" 
          name="t CO₂ saved (cumulative)" 
          stroke="#065f46"      /* green-800 line */
          strokeWidth={2} 
          dot={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
