'use client'

import React, { useState, useEffect } from 'react'
import Papa from 'papaparse'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const DIESEL_PRICE = 3.5  // $/gal

export default function DashboardPage() {
  const [dataRows, setDataRows] = useState<any[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [co2Cumulative, setCo2Cumulative] = useState<number[]>([])
  const [milesDaily, setMilesDaily] = useState<number[]>([])
  const [totalPallets, setTotalPallets] = useState(0)
  const [totalMiles, setTotalMiles] = useState(0)
  const [totalCO2, setTotalCO2] = useState(0)
  const [fuelSaved, setFuelSaved] = useState(0)

  // Chart.js common area options
  const areaOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { 
        grid: { display: false },
        title: { display: true, text: 'Date' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  }

  // CSV parse
  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[])
          .filter(r => r.date)
          .sort(
            (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        setDataRows(rows)
      },
    })
  }

  // Recompute all metrics when CSV changes
  useEffect(() => {
    if (!dataRows.length) return

    // daily labels
    const lbls = dataRows.map(r => r.date)
    setLabels(lbls)

    // cumulative CO2 + daily miles
    const cum: number[] = []
    let running = 0
    const milesArr: number[] = []
    dataRows.forEach(r => {
      running += Number(r.CO2_saved || 0)
      cum.push(Number(running.toFixed(1)))
      milesArr.push(Number(r.miles || 0))
    })
    setCo2Cumulative(cum)
    setMilesDaily(milesArr)

    // totals
    const sumPallets = dataRows.reduce((s, r) => s + (r.pallets || 0), 0)
    const sumMiles = dataRows.reduce((s, r) => s + (r.miles || 0), 0)
    setTotalPallets(sumPallets)
    setTotalMiles(sumMiles)
    setTotalCO2(Number(running.toFixed(1)))

    // fuel savings (gal) = CO2_t * 1000 kg/t ÷ 2.68 kg CO2/gal diesel
    const gal = (running * 1000) / 2.68
    setFuelSaved(Number(gal.toFixed(1)))
  }, [dataRows])

  return (
    <>
      {/* ─── Logo Bar ─── */}
      <header className="w-full border-b border-gray-200 py-4 mb-8">
        <div className="container mx-auto">
          <img
            src="/paliot-logo.png"
            alt="PALIoT Solutions"
            className="h-10"
          />
        </div>
      </header>

      {/* ─── Hero / Upload ─── */}
      <section className="container mx-auto mb-8 text-center">
        <h1 className="text-3xl font-semibold text-primary-color mb-2">
          Voluntary Carbon Credit Dashboard
        </h1>
        <p className="text-gray-700 mb-4">
          Track your pallets, miles, fuel & CO₂ removal in real time.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={e =>
            e.target.files?.[0] && handleFile(e.target.files[0])
          }
          className="btn-green"
        />
      </section>

      <main className="container mx-auto space-y-8">
        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatBox
            label="Total Pallets"
            value={totalPallets.toLocaleString()}
          />
          <StatBox
            label="Total Miles"
            value={totalMiles.toLocaleString()}
          />
          <StatBox
            label="Total CO₂ Removed (t)"
            value={totalCO2.toFixed(1)}
          />
        </div>

        {/* ─── Charts ─── */}
        <section>
          <h2 className="chart-heading">
            Cumulative CO₂ Removed (Last 3 Months)
          </h2>
          {co2Cumulative.length ? (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'CO₂ removed (t)',
                    data: co2Cumulative,
                    borderColor: 'var(--accent-color)',
                    backgroundColor: 'rgba(38,166,154,0.2)',
                    fill: true,
                    tension: 0.4, // smooth
                  },
                ],
              }}
              options={areaOptions}
              height={200}
            />
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg" />
          )}
        </section>

        <section>
          <h2 className="chart-heading">
            Daily Miles Traveled (Last 3 Months)
          </h2>
          {milesDaily.length ? (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'Miles',
                    data: milesDaily,
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(0,77,64,0.2)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={areaOptions}
              height={200}
            />
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg" />
          )}
        </section>

        {/* ─── Fuel Savings ─── */}
        <section className="text-center text-gray-600 text-sm space-y-1">
          <div>
            Fuel Savings:{' '}
            <span className="font-semibold text-green-700">
              {fuelSaved.toLocaleString()} gal
            </span>
          </div>
          <div>
            Estimated Cost Avoidance:{' '}
            <span className="font-semibold text-green-700">
              ${(fuelSaved * DIESEL_PRICE).toFixed(0)}
            </span>
          </div>
          <div className="text-xs">
            Diesel price at ${DIESEL_PRICE}/gal (US EIA, Jul 2025)
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-200 py-6 mt-12 text-center text-gray-500 text-xs">
        © 2025 PALIoT Solutions. All rights reserved.
      </footer>
    </>
  )
}

// ─── Simple Stat Box Component ─────────────────────────────────────
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary-color">
        {value}
      </div>
    </div>
  )
}
