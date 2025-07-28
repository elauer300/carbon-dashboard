'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Line } from 'react-chartjs-2'
import Chart from 'chart.js/auto'

export default function DashboardPage() {
  const [totalPallets, setTotalPallets] = useState(0)
  const [totalMiles, setTotalMiles]     = useState(0)
  const [totalCO2, setTotalCO2]         = useState(0)
  const [chartDataCO2, setChartDataCO2] = useState<any>(null)
  const [chartDataMiles, setChartDataMiles] = useState<any>(null)

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const data = res.data as any[]
        // compute totals
        let pallets = 0, miles = 0, co2 = 0
        data.forEach(r => {
          if (r.pallets) pallets += r.pallets
          if (r.miles) miles += r.miles
          if (r.co2_saved) co2   += r.co2_saved
        })
        setTotalPallets(pallets)
        setTotalMiles(miles)
        setTotalCO2(co2.toFixed(1))

        // build 3-month timeline
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const filtered = data.filter(r => new Date(r.date) >= threeMonthsAgo)

        const labels = filtered.map(r =>
          new Date(r.date).toLocaleDateString()
        )
        // cumulative CO2
        let cum = 0
        setChartDataCO2({
          labels,
          datasets: [{
            label: 'CO₂ Removed (t)',
            data: filtered.map(r => (cum += r.co2_saved)),
            fill: true,
            backgroundColor: 'rgba(38, 166, 154, 0.2)',
            borderColor: 'var(--accent-color)',
            tension: 0.3
          }]
        })
        // cumulative miles
        let cumM = 0
        setChartDataMiles({
          labels,
          datasets: [{
            label: 'Miles Traveled',
            data: filtered.map(r => (cumM += r.miles)),
            fill: true,
            backgroundColor: 'rgba(0, 77, 64, 0.2)',
            borderColor: 'var(--primary-color)',
            tension: 0.3
          }]
        })
      }
    })
  }

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          ['Total Pallets', totalPallets.toLocaleString()],
          ['Total Miles', totalMiles.toLocaleString()],
          ['Total CO₂ Removed (t)', totalCO2]
        ].map(([label, val]) => (
          <div key={label} className="border border-gray-300 p-4 rounded-lg shadow-sm bg-white">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="mt-1 text-2xl font-bold">{val}</div>
          </div>
        ))}
      </div>

      {/* CSV upload */}
      <input
        type="file"
        accept=".csv"
        onChange={e =>
          e.target.files?.[0] && handleFile(e.target.files[0])
        }
      />

      {/* CO2 chart */}
      {chartDataCO2 && (
        <section className="mt-8">
          <h2>CO₂ Removed (Last 3 Months)</h2>
          <Line data={chartDataCO2} options={{
            scales: { x: { grid: { display: false } } },
            plugins: { legend: { position: 'top' } }
          }} />
        </section>
      )}

      {/* Miles chart */}
      {chartDataMiles && (
        <section className="mt-8">
          <h2>Miles Traveled (Last 3 Months)</h2>
          <Line data={chartDataMiles} options={{
            scales: { x: { grid: { display: false } } },
            plugins: { legend: { position: 'top' } }
          }} />
        </section>
      )}
    </>
  )
}
