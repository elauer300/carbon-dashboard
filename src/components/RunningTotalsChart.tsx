/* ────────────────────────────────────────────────
   RunningTotalsChart – cumulative pallets & t CO₂
──────────────────────────────────────────────────── */
"use client";

import {
  ComposedChart, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
  Area, Bar, Legend
} from "recharts";
import { useMemo } from "react";

type Row = { date: string; pallets: number };
const CO2_PER_PALLET = 0.012;      // t CO₂ per pallet-year

interface Props { data: Row[]; }

export default function RunningTotalsChart({ data }: Props) {
  /* cumulative series (sorted by date) */
  const series = useMemo(() => {
    const sorted = [...data]
      .filter(r => r.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    let palletsSum = 0;
    let co2Sum     = 0;

    return sorted.map(r => {
      palletsSum += Number(r.pallets) || 0;
      co2Sum     += (Number(r.pallets) || 0) * CO2_PER_PALLET;
      return {
        date: r.date.slice(0, 10),   // keep YYYY-MM-DD for tooltip
        palletsCum: palletsSum,
        co2Cum:     +co2Sum.toFixed(2)
      };
    });
  }, [data]);

  if (series.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={series}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300/40" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left"  tickFormatter={n => n.toFixed(0)} />
        <YAxis yAxisId="right" orientation="right"
               tickFormatter={n => n.toFixed(0)} />
        <Tooltip />
        <Legend />
        {/* pallets – right axis, bars */}
        <Bar
          yAxisId="right"
          dataKey="palletsCum"
          name="Pallets (cumulative)"
          fill="#047857"
          barSize={14}
        />
        {/* CO₂ – left axis, area */}
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="co2Cum"
          name="t CO₂ Saved (cumulative)"
          stroke="#10b981"
          fill="#bbf7d0"
          fillOpacity={0.45}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
