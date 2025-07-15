"use client";

import Image from "next/image";

export default function Header({
  totalPallets,
  totalCO2,
  onUploadClick,
}: {
  totalPallets: number;
  totalCO2: number;
  onUploadClick: () => void;
}) {
  return (
    <header className="flex flex-col items-center py-6 gap-4">
      {/* logo + title */}
      <div className="flex flex-col items-center">
        <Image
          src="/paliot-logo.png"
          alt="Paliot logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-2xl sm:text-3xl font-bold mt-2 tracking-wide text-green-800">
          Pallet Carbon Dashboard
        </h1>
        <p className="text-xs text-center text-muted/70 max-w-xs mt-1">
          Upload a shipments CSV to track pallet usage&nbsp;&amp; carbon removal
          in real time.
        </p>
      </div>

      {/* stats + upload */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <StatCard label="Total Pallets" value={totalPallets.toLocaleString()} />
        <StatCard
          label="Tons CO₂ removed"
          value={totalCO2.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        />
        <button
          onClick={onUploadClick}
          className="btn-green px-4 py-2 text-sm font-semibold rounded-md shadow-sm"
        >
          Upload CSV
        </button>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-center shadow-sm min-w-[130px]">
      <p className="text-[11px] uppercase tracking-wide text-green-700/80">
        {label}
      </p>
      <p className="text-lg font-bold text-green-800">{value}</p>
    </div>
  );
}
