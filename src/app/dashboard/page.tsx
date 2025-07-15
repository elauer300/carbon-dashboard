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
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Header from '@/components/Header'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

const CO2_PER_MILE_T = 1.87e-6 // t CO₂ per mile-per-pallet

type Row = { date: Date; pallets: number; miles: number }

export default function DashboardPage() {
  /* ── state ── */
  const [rows, setRows] = useState<Row[]>([])
  const [totPallets, setTotPallets] = useState(0)
  const [totMiles,   setTotMiles]   = useState(0)
  const [totCO2,     setTotCO2]     = useState(0)
  const [co2Data,    setCo2Data]    = useState<any>(null)
  const [mileData,   setMileData]   = useState<any>(null)

  /* ── csv upload ── */
  function loadCSV(file: File) {
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
              miles:   +((r.miles   || r.Miles   || '0').replace(/,/g, ''))
            }
          })
          .filter(Boolean) as Row[]
        parsed.sort((a,b)=>a.date.getTime()-b.date.getTime())
        setRows(parsed)
      }
    })
  }

  /* ── build KPIs + chart datasets ── */
  useEffect(() => {
    if (!rows.length) return

    const first = rows[0].date
    const last  = rows[rows.length-1].date
    const dayMS = 86_400_000
    const timeline: Date[] = []
    for (let t=first.getTime(); t<=last.getTime(); t+=dayMS) timeline.push(new Date(t))
    const map = new Map(rows.map(r=>[r.date.toDateString(),r]))

    const labels:string[]=[]; const cumMiles:number[]=[]; const cumCO2:number[]=[]
    let mAcc=0, cAcc=0
    timeline.forEach(d=>{
      const r=map.get(d.toDateString())
      const miles=r?.miles||0
      const pallets=r?.pallets||0
      mAcc+=miles
      cAcc+=pallets*miles*CO2_PER_MILE_T
      labels.push(`${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`)
      cumMiles.push(+mAcc.toFixed(1))
      cumCO2.push(+cAcc.toFixed(2))
    })

    /* totals */
    setTotPallets(rows.reduce((s,r)=>s+r.pallets,0))
    setTotMiles(mAcc)
    setTotCO2(cAcc)

    /* last 3 months slice */
    const threeAgo = new Date(last); threeAgo.setMonth(threeAgo.getMonth()-3)
    const idx = labels.findIndex((_,i)=>timeline[i]>=threeAgo)
    const s = idx<0?0:idx

    setCo2Data({
      labels: labels.slice(s),
      datasets:[{
        label:'Cumulative CO₂ Removed (t)',
        data:  cumCO2.slice(s),
        fill:true,
        backgroundColor:'rgba(34,197,94,0.25)',
        borderColor:'rgba(34,197,94,1)',
        tension:0.25, pointRadius:0
      }]
    })
    setMileData({
      labels: labels.slice(s),
      datasets:[{
        label:'Cumulative Miles',
        data:  cumMiles.slice(s),
        fill:true,
        backgroundColor:'rgba(59,130,246,0.25)',
        borderColor:'rgba(59,130,246,1)',
        tension:0.25, pointRadius:0
      }]
    })
  }, [rows])

  const areaOpts = {
    responsive:true,
    maintainAspectRatio:false,
    scales:{ y:{ beginAtZero:true } },
    plugins:{ legend:{ position:'top' as const } }
  }

  /* ── UI ── */
  return (
    <>
      <Header/>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* KPI • bordered cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Total Pallets" value={totPallets.toLocaleString()}/>
          <Stat label="Total Miles"   value={totMiles.toLocaleString()}/>
          <Stat label="Total CO₂ Removed (t)" value={totCO2.toFixed(1)}/>
        </div>

        <input type="file" accept=".csv"
               onChange={e=>e.target.files?.[0]&&loadCSV(e.target.files[0])} />

        {/* chart #1 – CO₂ */}
        {co2Data && (
          <section className="h-48">
            <h2 className="text-xl font-semibold mb-1">
              Cumulative CO₂ Removed (Last 3 Months)
            </h2>
            <Line data={co2Data} options={areaOpts}/>
          </section>
        )}

        {/* chart #2 – Miles */}
        {mileData && (
          <section className="h-48">
            <h2 className="text-xl font-semibold mb-1">
              Cumulative Miles Traveled (Last 3 Months)
            </h2>
            <Line data={mileData} options={areaOpts}/>
          </section>
        )}
      </main>
    </>
  )
}

/* reusable stat box */
function Stat({label,value}:{label:string;value:string}) {
  return (
    <div className="border border-gray-300 p-4 rounded-lg shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold text-green-700">{value}</div>
    </div>
  )
}
