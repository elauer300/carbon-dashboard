'use client';

import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area, ResponsiveContainer } from 'recharts';

interface MonthlyDataPoint {
  month: string;
  pallets: number;
}

interface MonthlyChartProps {
  data: MonthlyDataPoint[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  // Tailwind green-600 as primary accent color
  const primaryColor = "#16a34a";  // equivalent to class "text-green-600"
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        {/* Grid with dashed lines for visual aid */}
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" /* gray-300 */ />
        {/* X-axis: months (e.g., "2025-04"), styled in gray-600 */}
        <XAxis dataKey="month" tick={{ fill: '#4B5563', fontSize: 12 }} />
        {/* Y-axis: pallet count, styled in gray-600 */}
        <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value} pallets`} labelFormatter={(label) => `Month: ${label}`} />
        {/* Area series for pallets per month with green stroke and gradient fill */}
        <defs>
          <linearGradient id="palletGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4}/>
            <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="pallets" stroke={primaryColor} strokeWidth={2} fill="url(#palletGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
