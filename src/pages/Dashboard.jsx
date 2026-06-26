import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import { getDashboardStats } from '../services/tiks'
import { areaColors } from '../data/mockData'

const ORANGE = '#E07B22'
const ORANGE_LIGHT = '#F5C99E'

function buildStats(rawTiks) {
  const byAreaMap = {}
  const byDayMap = {}
  const byMonthMap = {}
  const bySecretariaMap = {}

  rawTiks.forEach((tik) => {
    const area = tik.area || 'Outros'
    byAreaMap[area] = (byAreaMap[area] || 0) + 1

    const date = new Date(tik.created_at)
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    byDayMap[day] = (byDayMap[day] || 0) + 1

    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('. ', '/')
      .replace('.', '/')
    byMonthMap[month] = (byMonthMap[month] || 0) + 1

    const sec = tik.profiles?.secretaria || 'Outros'
    bySecretariaMap[sec] = (bySecretariaMap[sec] || 0) + 1
  })

  return {
    total: rawTiks.length,
    byArea: Object.entries(byAreaMap).map(([name, value]) => ({
      name, value, color: areaColors[name] || '#999',
    })),
    byDay: Object.entries(byDayMap).map(([date, count]) => ({ date, count })),
    byMonth: Object.entries(byMonthMap).map(([month, count]) => ({ month, count })),
    bySecretaria: Object.entries(bySecretariaMap).map(([name, count]) => ({ name, count })),
  }
}

export default function Dashboard() {
  const [city, setCity] = useState('Sorocaba')
  const [startDate, setStartDate] = useState('2026-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardStats(city, startDate, endDate)
      .then((data) => setStats(buildStats(data)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [city, startDate, endDate])

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-lg font-semibold text-gray-600 mb-4">Dashboard</h1>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option>Sorocaba</option>
            <option>Gorizia</option>
            <option>Trieste</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Data inicial:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Data final:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {loading && <p className="text-gray-400 text-sm">Carregando dados...</p>}

        {!loading && stats && (
          <>
            {/* Total + Pie */}
            <div className="flex items-start gap-8 mb-8 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 border border-tik-orange rounded px-2 py-1">
                  Total de TIKs
                </span>
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg bg-tik-orange">
                  {stats.total}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">TIKs por área:</p>
                  <div className="space-y-1">
                    {stats.byArea.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {stats.byArea.length > 0 && (
                  <PieChart width={180} height={150}>
                    <Pie data={stats.byArea} cx={90} cy={75} outerRadius={65} dataKey="value">
                      {stats.byArea.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </div>
            </div>

            {/* Line chart */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-tik-orange mb-3">Número de TIKs por dia:</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={ORANGE} strokeWidth={2} dot={{ fill: ORANGE, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart mês */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-tik-orange mb-3">Número de TIKs por mês:</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={ORANGE_LIGHT} stroke={ORANGE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart secretaria */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-tik-orange mb-3">Número de TIKs por secretaria:</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.bySecretaria}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={ORANGE_LIGHT} stroke={ORANGE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
