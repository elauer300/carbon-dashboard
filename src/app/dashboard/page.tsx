'use client'

import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import Chart from 'chart.js/auto'     // auto-registers every controller
import { Filler } from 'chart.js'
import Header from '@/components/Header'

Chart.register(Filler)

const CO2_PER_MILE_T = 1.87e-6
type Row = { date: Date; pallets: number; miles: number }

export default function DashboardPage() {
  /* raw rows from CSV */
  const [rows, setRows] = useState<Row[]>([])

  /* KPI totals */
  const [totP, setTotP] = useState(0)
  const [totM, setTotM] = useState(0)
  const [totCO2, setTotCO2] = useState(0)

  /* one-time canvas refs */
  const co2Canvas = useRef<HTMLCanvasElement>(null)
  const milesCanvas = useRef<HTMLCanvasElement>(null)

  /* persistent ChartJS instances */
  const co2Chart = useRef<Chart | null>(null)
  const milesChart = useRef<Chart | null>(null)

  /* ─── CSV upload ─── */
  function handleCSV(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed: Row[] = (data as any[])
          .map((r) => {
            const raw = r.date || r.Date || r.month || r.Month
            if (!raw) return null
            const [m, d, y] = (raw as string).split('/')
            return {
              date: new Date(+y, +m - 1, +d),
              pallets: +((r.pallets || r.Pallets || '0').replace(/,/g, '')),
              miles: +((r.miles || r.Miles || '0').replace(/,/g, '')),
            }
          })
          .filter(Boolean) as Row[]

        parsed.sort((a, b) => a.date.getTime() - b.date.getTime())
        setRows(parsed)
      },
    })
  }

  /* ─── build chart data whenever rows change ─── */
  useEffect(() => {
    if (!rows.length) return

    /* complete timeline */
    const first = rows[0].date
    const last = rows[rows.length - 1].date
    const dayMS = 86_400_000
    const timeline: Date[] = []
    for (let t = first.getTime(); t <= last.getTime(); t += dayMS)
      timeline.push(new Date(t))

    const map = new Map(rows.map((r) => [r.date.toDateString(), r]))

    const labels: string[] = []
    const cumMiles: number[] = []
    const cumCO2: number[] = []

    let mAcc = 0,
      cAcc = 0
    timeline.forEach((d) => {
      const r = map.get(d.toDateString())
      const miles = r?.miles || 0
      const pallets = r?.pallets || 0
      mAcc += miles
      cAcc += pallets * miles * CO2_PER_MILE_T
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
      cumMiles.push(+mAcc.toFixed(1))
      cumCO2.push(+cAcc.toFixed(2))
    })

    /* totals */
    setTotP(rows.reduce((s, r) => s + r.pallets, 0))
    setTotM(mAcc)
    setTotCO2(cAcc)

    /* slice to last 3 months */
    const threeAgo = new Date(last)
    threeAgo.setMonth(threeAgo.getMonth() - 3)
    const start = labels.findIndex((_, i) => timeline[i] >= threeAgo)
    const s = start < 0 ? 0 : start

    const lbl = labels.slice(s)
    const miles3 = cumMiles.slice(s)
    const co23 = cumCO2.slice(s)

    /* CO2 chart – create once, then update */
    if (!co2Chart.current && co2Canvas.current) {
      co2Chart.current = new Chart(co2Canvas.current, {
        type: 'line',
        data: { labels: lbl, datasets: [] },
        options: baseOpts,
      })
    }
    if (co2Chart.current) {
      co2Chart.current.data.labels = lbl
      co2Chart.current.data.datasets = [
        {
          label: 'Cumulative CO₂ Removed (t)',
          data: co23,
          fill: true,
          backgroundColor: 'rgba(34,197,94,0.25)',
          borderColor: 'rgba(34,197,94,1)',
          tension: 0.25,
          pointRadius: 0,
        },
      ]
      co2Chart.current.update()
    }

    /* Miles chart – create once, then update */
    if (!milesChart.current && milesCanvas.current) {
      milesChart.current = new Chart(milesCanvas.current, {
        type: 'line',
        data: { labels: lbl, datasets: [] },
        options: baseOpts,
      })
    }
    if (milesChart.current) {
      milesChart.current.data.labels = lbl
      milesChart.current.data.datasets = [
        {
          label: 'Cumulative Miles',
          data: miles3,
          fill: true,
          backgroundColor: 'rgba(59,130,246,0.25)',
          borderColor: 'rgba(59,130,246,1)',
          tension: 0.25,
          pointRadius: 0,
        },
      ]
      milesChart.current.update()
    }
  }, [rows])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card label="Total Pallets" value={totP.toLocaleString()} />
          <Card label="Total Miles" value={totM.toLocaleString()} />
          <Card label="Total CO₂ Removed (t)" value={totCO2.toFixed(1)} />
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])}
        />

        {/* CO₂ */}
        <section className="h-48">
          <h2 className="text-xl font-semibold mb-1">
            Cumulative CO₂ Removed (Last 3 Months)
          </h2>
          <canvas ref={co2Canvas} className="w-full h-full" />
        </section>

        {/* Miles */}
        <section className="h-48">
          <h2 className="text-xl font-semibold mb-1">
            Cumulative Miles Traveled (Last 3 Months)
          </h2>
          <canvas ref={milesCanvas} className="w-full h-full" />
        </section>
      </main>
    </>
  )
}

/* shared chart options */
const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
  plugins: { legend: { position: 'top' as const } },
}

/* KPI card */
function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-300 p-4 rounded-lg shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold text-green-700">{value}</div>
    </div>
  )
}
