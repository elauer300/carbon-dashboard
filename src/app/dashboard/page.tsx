'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Header from '@/components/Header'

// register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

// ————— Constants —————
const WEIGHT_PALIOT_TONS   = 48  / 2000      // 48 lb → tons
const WEIGHT_COMP_TONS     = 70  / 2000      // 70 lb → tons
const GALLONS_PER_TON_MILE = 0.17 / 10.16    // ≈0.0167 gal/ton-mi
const DIESEL_PRICE         = 3.81            // $/gal (EIA July 2025)
const DIESEL_SOURCE_NOTE   = 'EIA, July 2025'
const EPA_FACTOR           = 0.17            // kg CO₂ / ton-mi

type Row = { date: Date; pallets: number; miles: number }

export default function DashboardPage() {
  // CSV state & KPIs
  const [rows, setRows]       = useState<Row[]>([])
  const [totP, setTotP]       = useState(0)
  const [totM, setTotM]       = useState(0)
  const [totCO2, setTotCO2]   = useState(0)

  // cumulative charts
  const [fuelData, setFuelData] = useState<any>(null)
  const [co2Data,  setCo2Data]  = useState<any>(null)
  const [galSaved, setGalSaved] = useState(0)
  const [costSaved,setCostSaved]= useState(0)

  // Prospective‐lane inputs
  const [planPallets, setPlanPallets] = useState(0)
  const [planMiles,   setPlanMiles]   = useState(0)

  // parse CSV
  function handleCSV(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed = (data as any[])
          .map(r => {
            const raw = r.date || r.Date || r.month || r.Month
            if (!raw) return null
            const [m,d,y] = (raw as string).split('/')
            return {
              date:   new Date(+y, +m - 1, +d),
              pallets:+String(r.pallets||r.Pallets||0).replace(/,/g,''),
              miles:  +String(r.miles  ||r.Miles  ||0).replace(/,/g,'')
            }
          })
          .filter(Boolean) as Row[]
        parsed.sort((a,b)=>a.date.getTime()-b.date.getTime())
        setRows(parsed)
      }
    })
  }

  // recompute cumulative charts on CSV change
  useEffect(() => {
    if (!rows.length) return

    const dayMS = 24*60*60*1000
    const start = rows[0].date.getTime()
    const end   = rows[rows.length-1].date.getTime()
    const timeline: Date[] = []
    for (let t=start; t<=end; t+=dayMS) timeline.push(new Date(t))

    const map = new Map(rows.map(r=>[r.date.toDateString(),r]))
    let mAcc=0, cAcc=0, fP=0, fC=0, eP=0, eC=0
    const labels: string[] = []
    const cumFuelP: number[] = [], cumFuelC: number[] = []
    const cumCo2P: number[]  = [], cumCo2C: number[]  = []

    timeline.forEach(d => {
      const rec     = map.get(d.toDateString())
      const pallets = rec?.pallets||0
      const miles   = rec?.miles  ||0

      mAcc += miles
      cAcc += pallets*miles*1.87e-6

      fP += pallets*miles*WEIGHT_PALIOT_TONS * GALLONS_PER_TON_MILE
      fC += pallets*miles*WEIGHT_COMP_TONS   * GALLONS_PER_TON_MILE

      eP += pallets*miles*WEIGHT_PALIOT_TONS * EPA_FACTOR/1000
      eC += pallets*miles*WEIGHT_COMP_TONS   * EPA_FACTOR/1000

      cumFuelP.push(+fP.toFixed(1))
      cumFuelC.push(+fC.toFixed(1))
      cumCo2P .push(+eP.toFixed(2))
      cumCo2C .push(+eC.toFixed(2))
      labels.push(`${d.getMonth()+1}/${d.getDate()}`)
    })

    setTotP(rows.reduce((s,r)=>s+r.pallets,0))
    setTotM(mAcc)
    setTotCO2(cAcc)

    // last 3 months slice
    const threeAgo = new Date(end); threeAgo.setMonth(threeAgo.getMonth()-3)
    const idx = timeline.findIndex(d=>d>=threeAgo)
    const s = idx<0?0:idx

    setFuelData({
      labels: labels.slice(s),
      datasets: [
        {
          label:'Paliot Fuel',
          data: cumFuelP.slice(s),
          fill:'origin',
          backgroundColor:'rgba(34,197,94,0.25)',
          borderColor:'rgba(34,197,94,1)',
          tension:0.4,pointRadius:0,stack:'f'
        },
        {
          label:'Competitor Fuel',
          data: cumFuelC.slice(s),
          fill:'-1',
          backgroundColor:'rgba(239,68,68,0.25)',
          borderColor:'rgba(239,68,68,1)',
          tension:0.4,pointRadius:0,stack:'f'
        }
      ]
    })

    setCo2Data({
      labels: labels.slice(s),
      datasets: [
        {
          label:'Paliot CO₂',
          data: cumCo2P.slice(s),
          fill:'origin',
          backgroundColor:'rgba(34,197,94,0.25)',
          borderColor:'rgba(34,197,94,1)',
          tension:0.4,pointRadius:0,stack:'c'
        },
        {
          label:'Competitor CO₂',
          data: cumCo2C.slice(s),
          fill:'-1',
          backgroundColor:'rgba(239,68,68,0.25)',
          borderColor:'rgba(239,68,68,1)',
          tension:0.4,pointRadius:0,stack:'c'
        }
      ]
    })

    // final savings
    const lastF  = cumFuelC[cumFuelC.length-1] - cumFuelP[cumFuelP.length-1]
    setGalSaved(+lastF.toFixed(1))
    setCostSaved(+(lastF*DIESEL_PRICE).toFixed(2))

  }, [rows])

  // shared area options
  const areaOpts: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales:{ y:{ stacked:true, beginAtZero:true } },
    plugins:{ legend:{ position:'top' } }
  }

  // ————— render —————
  return (
    <>
      <Header/>
      <main className="mx-auto max-w-4xl p-6 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Stat label="Total Pallets"         value={totP.toLocaleString()} />
          <Stat label="Total Miles"           value={totM.toLocaleString()} />
          <Stat label="Total CO₂ Removed (t)" value={totCO2.toFixed(1)} />
          <Stat label="Fuel Saved (gal)"      value={galSaved.toLocaleString()} />
        </div>

        {/* CSV upload */}
        <input
          type="file" accept=".csv"
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          onChange={e=>e.target.files?.[0]&&handleCSV(e.target.files[0])}
        />

        {/* Cumulative Fuel */}
        {fuelData && (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Cumulative Fuel Usage (Last 3 Months)</h2>
            <div className="relative w-full h-[280px]">
              <Line data={fuelData} options={areaOpts} height={280}/>
            </div>
            <div className="text-sm text-gray-600">
              Fuel Savings:{' '}
              <span className="font-bold text-green-700">
                {galSaved.toLocaleString()} gal ={' '}
                {costSaved.toLocaleString('en-US',{style:'currency',currency:'USD'})}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Diesel price assumed at ${DIESEL_PRICE}/gal ({DIESEL_SOURCE_NOTE})
            </div>
          </section>
        )}

        {/* Cumulative CO₂ */}
        {co2Data && (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Cumulative CO₂ Impact (Last 3 Months)</h2>
            <div className="relative w-full h-[280px]">
              <Line data={co2Data} options={areaOpts} height={280}/>
            </div>
            <div className="text-xs text-gray-500">
              Emissions factor: {EPA_FACTOR} kg CO₂/ton-mile
            </div>
          </section>
        )}

        {/* Prospective Lane */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Prospective Lane Savings</h2>
          <p>Enter pallets & miles/trip—then see fuel & CO₂ for 6, 8, 10 trips/year:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pallets</label>
              <input
                type="number"
                className="mt-1 w-full rounded border-gray-300 shadow-sm"
                value={planPallets}
                onChange={e=>setPlanPallets(+e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Miles/Trip</label>
              <input
                type="number"
                className="mt-1 w-full rounded border-gray-300 shadow-sm"
                value={planMiles}
                onChange={e=>setPlanMiles(+e.target.value)}
              />
            </div>
          </div>

          {planPallets>0 && planMiles>0 && (
            <>
              {/** build scenario arrays */}
              {(() => {
                const trips = [6,8,10]
                const fP = trips.map(t=>+(planPallets*planMiles*t*WEIGHT_PALIOT_TONS*GALLONS_PER_TON_MILE).toFixed(1))
                const fC = trips.map(t=>+(planPallets*planMiles*t*WEIGHT_COMP_TONS  *GALLONS_PER_TON_MILE).toFixed(1))
                const eP = trips.map(t=>+(planPallets*planMiles*t*WEIGHT_PALIOT_TONS*EPA_FACTOR/1000).toFixed(2))
                const eC = trips.map(t=>+(planPallets*planMiles*t*WEIGHT_COMP_TONS  *EPA_FACTOR/1000).toFixed(2))
                const lastSaveGal  = +(fC[2]-fP[2]).toFixed(1)
                const lastSaveCost = +(lastSaveGal*DIESEL_PRICE).toFixed(2)

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fuel scenario */}
                    <div>
                      <h3 className="font-semibold mb-2">Fuel (gal) vs Competitor</h3>
                      <div className="relative w-full h-[200px]">
                        <Line
                          data={{
                            labels: trips.map(t=>`${t} trips`),
                            datasets:[
                              {
                                label:'Paliot',
                                data:fP,
                                backgroundColor:'rgba(34,197,94,0.25)',
                                borderColor:'rgba(34,197,94,1)',
                                fill:'origin',
                                tension:0.4,pointRadius:0
                              },
                              {
                                label:'Competitor',
                                data:fC,
                                backgroundColor:'rgba(239,68,68,0.25)',
                                borderColor:'rgba(239,68,68,1)',
                                fill:'origin',
                                tension:0.4,pointRadius:0
                              }
                            ]
                          }}
                          options={{ ...areaOpts, plugins:{ legend:{ position:'bottom' } } }}
                          height={200}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        Fuel Savings (10 trips):{' '}
                        <span className="font-bold text-green-700">
                          {lastSaveGal.toLocaleString()} gal ={' '}
                          {lastSaveCost.toLocaleString('en-US',{style:'currency',currency:'USD'})}
                        </span>
                      </div>
                    </div>

                    {/* CO₂ scenario */}
                    <div>
                      <h3 className="font-semibold mb-2">CO₂ (t) vs Competitor</h3>
                      <div className="relative w-full h-[200px]">
                        <Line
                          data={{
                            labels: trips.map(t=>`${t} trips`),
                            datasets:[
                              {
                                label:'Paliot',
                                data:eP,
                                backgroundColor:'rgba(34,197,94,0.25)',
                                borderColor:'rgba(34,197,94,1)',
                                fill:'origin',
                                tension:0.4,pointRadius:0
                              },
                              {
                                label:'Competitor',
                                data:eC,
                                backgroundColor:'rgba(239,68,68,0.25)',
                                borderColor:'rgba(239,68,68,1)',
                                fill:'origin',
                                tension:0.4,pointRadius:0
                              }
                            ]
                          }}
                          options={{ ...areaOpts, plugins:{ legend:{ position:'bottom' } } }}
                          height={200}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </section>

      </main>
    </>
  )
}

// simple stat card
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-300 p-4 rounded-lg shadow-sm bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
