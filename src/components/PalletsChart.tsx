/* ────────────────────────────────────────────────
   PalletsChart –­ Area chart of pallets shipped / mo
──────────────────────────────────────────────────── */
"use client";

import {
  AreaChart, Area, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip
} from "recharts";
import { useMemo } from "react";

/* raw row coming from Papa.parse */
type Row = { date: string; pallets: number };

interface Props { data: Row[]; }

export default function PalletsChart({ data }: Props) {
  /* aggregate by month (YYYY-MM) */
  const monthly = useMemo(() => {
    const byMonth: Record<string, number> = {};

    data.forEach(r => {
      if (!r?.date) return;
      const key = r.date.slice(0, 7);            // 2025-06-14 → 2025-06
      byMonth[key] = (byMonth[key] || 0) + (Number(r.pallets) || 0);
    });

    /* sort chronologically */
    return Object
      .entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pallets]) => ({ month, pallets }));
  }, [data]);

  if (monthly.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={monthly}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300/40" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="pallets"
          stroke="#047857"     /* emerald-700 */
          fill="#bbf7d0"       /* emerald-100 */
          fillOpacity={0.45}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
