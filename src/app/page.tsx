// src/app/page.tsx
"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  // State hooks for CSV data, chart data, KPIs, etc.
  const [totalPallets, setTotalPallets] = useState(0);
  const [totalMiles, setTotalMiles] = useState(0);
  const [totalCO2, setTotalCO2] = useState(0);
  const [chartDataCO2, setChartDataCO2] = useState<any>(null);
  const [chartDataMiles, setChartDataMiles] = useState<any>(null);

  // Handler for CSV upload
  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Array<{
          date: string;
          pallets: string;
          miles: string;
          co2_saved: string;
        }>;

        // Aggregate totals
        let palletsSum = 0,
          milesSum = 0,
          co2Sum = 0;
        const labels: string[] = [];
        const co2Cumulative: number[] = [];
        const milesCumulative: number[] = [];
        rows.forEach((r) => {
          palletsSum += Number(r.pallets || 0);
          milesSum += Number(r.miles || 0);
          co2Sum += Number(r.co2_saved || 0);
          labels.push(r.date);
          co2Cumulative.push(co2Sum);
          milesCumulative.push(milesSum);
        });

        setTotalPallets(palletsSum);
        setTotalMiles(milesSum);
        setTotalCO2(co2Sum);

        setChartDataCO2({
          labels,
          datasets: [
            {
              label: "Cumulative CO₂ Removed (t)",
              data: co2Cumulative,
              borderColor: "#26a69a",
              backgroundColor: "rgba(38,166,154,0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        });

        setChartDataMiles({
          labels,
          datasets: [
            {
              label: "Cumulative Miles Traveled",
              data: milesCumulative,
              borderColor: "#004d40",
              backgroundColor: "rgba(0,77,64,0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        });
      },
    });
  }

  // Common chart options
  const areaOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  return (
    <section>
      {/* --- KPI stat cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatBox label="Total Pallets" value={totalPallets.toLocaleString()} />
        <StatBox
          label="Total Miles"
          value={totalMiles.toLocaleString()}
        />
        <StatBox
          label="Total CO₂ Removed (t)"
          value={totalCO2.toFixed(1)}
        />
      </div>

      {/* --- CSV uploader --- */}
      <div className="mb-8">
        <input
          type="file"
          accept=".csv"
          onChange={(e) =>
            e.target.files?.[0] && handleFile(e.target.files[0])
          }
        />
      </div>

      {/* --- CO2 Area Chart --- */}
      {chartDataCO2 && (
        <div className="mb-12">
          <h2 className="chart-heading">
            Cumulative CO₂ Removed (Last 3 Months)
          </h2>
          <Line data={chartDataCO2} options={areaOptions} height={200} />
        </div>
      )}

      {/* --- Miles Area Chart --- */}
      {chartDataMiles && (
        <div className="mb-12">
          <h2 className="chart-heading">
            Cumulative Miles Traveled (Last 3 Months)
          </h2>
          <Line data={chartDataMiles} options={areaOptions} height={200} />
        </div>
      )}
    </section>
  );
}

// Simple stat card component
function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-300 p-4 rounded-lg shadow-sm bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold text-green-700">{value}</div>
    </div>
  );
}
