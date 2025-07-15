"use client";

interface Props {
  label: string;
  value: number | string;
}

export default function KpiCard({ label, value }: Props) {
  return (
    <div className="rounded-lg border p-4 shadow-sm bg-white">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
