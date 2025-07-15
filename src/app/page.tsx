'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Tooltip,
  Legend,
  Filler
)

const CO2_PER_MILE_T = 1.87e-6 // tonnes CO₂ removed per mile per pallet

export default function Page() {
  const [records, setRecords] = useState<{ date: Date; pallets: number; miles: number }[]>([])
  const [totalPallets, setTotalPallets] = useState(0)
  const [totalMiles, setTotalMiles] = useState(0)
  const [totalCO2, setTotalCO2] = useState(0)
  const [dataCO2, setDataCO2] = useState<any>(null)
  const [dataMiles, setDataMiles] = useState<any>(null)

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const cleaned = (data as any[])
          .map((r) => {
            const dateStr = r.date || r.Date || r.month || r.Month
            const [m, d, y] = (dateStr as string).split('/')
            return {
              date: new Date(+y, +m - 1, +d),
              pallets: +((r.pallets || r.Pallets || '0') as string).replace(/,/g, '') || 0,
              miles: +((r.miles || r.Miles || '0') as string).replace(/,/g, '') || 0,
            }
          })
          .filter((r) => !isNaN(r.date.getTime()))
          .sort((a, b) => a.date.getTime() - b.date.getTime())

        setRecords(cleaned)
      },
    })
  }

  useEffect(() => {
    if (records.length === 0) return

    // Build day-by-day timeline
    const first = records[0].date
    const last = records[records.length - 1].date
    const dayMS = 24 * 60 * 60 * 1000
    const timeline: Date[] = []
    for (let t = first.getTime(); t <= last.getTime(); t += dayMS) {
      timeline.push(new Date(t))
    }

    const map = new Map(records.map((r) => [r.date.toDateString(), r]))

    const labels: string[] = []
    const dailyMiles: number[] = []
    const cumMiles: number[] = []
    const cumCO2: number[] = []
    let mSum = 0,
      co2Sum = 0

    timeline.forEach((d) => {
      const rec = map.get(d.toDateString())
      const miles = rec?.miles || 0
      const pallets = rec?.pallets || 0
      mSum += miles
      co2Sum += pallets * miles * CO2_PER_MILE_T

      labels.push(`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)
      dailyMiles.push(miles)
      cumMiles.push(parseFloat(mSum.toFixed(1)))
      cumCO2.push(parseFloat(co2Sum.toFixed(2)))
    })

    // Compute KPIs
    setTotalPallets(records.reduce((sum, r) => sum + r.pallets, 0))
    setTotalMiles(dailyMiles.reduce((sum, v) => sum + v, 0))
    setTotalCO2(cumCO2[cumCO2.length - 1] || 0)

    // Slice last 3 months
    const threeAgo = new Date(last)
    threeAgo.setMonth(threeAgo.getMonth() - 3)
    const startIdx = labels.findIndex((_, i) => timeline[i] >= threeAgo)
    const s = startIdx < 0 ? 0 : startIdx

    const lbl3 = labels.slice(s)
    const cm3 = cumCO2.slice(s)
    const mm3 = cumMiles.slice(s)

    setDataCO2({
      labels: lbl3,
      datasets: [
        {
          label: 'Cumulative CO₂ Removed (t)',
          data: cm3,
          fill: true,
          backgroundColor: 'rgba(34,197,94,0.2)',
          borderColor: 'rgba(34,197,94,1)',
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    })

    setDataMiles({
      labels: lbl3,
      datasets: [
        {
          label: 'Cumulative Miles',
          data: mm3,
          fill: true,
          backgroundColor: 'rgba(59,130,246,0.2)',
          borderColor: 'rgba(59,130,246,1)',
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    })
  }, [records])

  const areaOptions = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' as const } },
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-300 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Pallets</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{totalPallets.toLocaleString()}</div>
        </div>
        <div className="border border-gray-300 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Miles</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{totalMiles.toLocaleString()}</div>
        </div>
        <div className="border border-gray-300 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total CO₂ Removed (t)</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{totalCO2.toFixed(1)}</div>
        </div>
      </div>

      {/* CSV Upload */}
      <div>
        <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* CO₂ Chart (Top) */}
      {dataCO2 && (
        <section className="h-64">
          <h2 className="text-xl font-semibold mb-2">Cumulative CO₂ Removed (Last 3 Months)</h2>
          <Line data={dataCO2} options={areaOptions} />
        </section>
      )}

      {/* Miles Chart (Bottom) */}
      {dataMiles && (
        <section className="h-64">
          <h2 className="text-xl font-semibold mb-2">Cumulative Miles Traveled (Last 3 Months)</h2>
          <Line data={dataMiles} options={areaOptions} />
        </section>
      )}
    </main>
  )
}
