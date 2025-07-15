"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
  totalPallets: number;
  totalCO2: number;
  onUploadClick: () => void;
}

export default function Header({ totalPallets, totalCO2, onUploadClick }: Props) {
  return (
    <header className="flex flex-col items-center py-6 text-green-900">
      {/* --- logo --- */}
      <Link href="https://paliotsolutions.com" target="_blank" className="mb-2">
        <Image
          src="/paliot-logo.png"
          alt="Paliot logo"
          width={96}
          height={96}
          priority
        />
      </Link>

      {/* --- title --- */}
      <h1 className="text-2xl font-bold tracking-tight">
        Pallet&nbsp;⸺&nbsp;Carbon&nbsp;Dashboard
      </h1>

      {/* --- tagline --- */}
      <p className="text-sm text-green-700 mb-4">
        Upload a shipments CSV to track pallet usage &amp; carbon removal in real time.
      </p>

      {/* --- stats strip --- */}
      <div className="flex gap-6 mb-4">
        <StatBox label="Total Pallets" value={totalPallets.toLocaleString()} />
        <StatBox
          label="Tons CO₂ Removed"
          value={totalCO2.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
      </div>

      {/* --- upload button (triggers hidden file input) --- */}
      <button onClick={onUploadClick} className="btn-green px-6 py-2 rounded-lg">
        Upload CSV
      </button>
    </header>
  );
}

/* small helper for each KPI */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 border rounded-lg bg-green-50">
      <span className="text-xs uppercase tracking-wide text-green-600">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
