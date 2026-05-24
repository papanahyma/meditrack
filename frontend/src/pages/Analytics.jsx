import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Pill, CheckCircle2, XCircle, Clock, TrendingUp, Calendar, Info } from 'lucide-react';
import Navbar from '../components/NavBar';
import API from '../services/api';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const API_URL = import.meta.env.VITE_API_URL;

const COLORS = {
  Taken: '#10b981',
  Missed: '#f43f5e',
  Pending: '#f59e0b',
};

const Analytics = () => {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    taken: 0,
    missed: 0,
    pending: 0,
    adherence: 0,
    heatmapData: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return navigate('/')

    const fetchData = async () => {
      try {
        const res = await API.get(`/medications/dashboard/stats?userId=${user._id}`)
        const data = res.data || {}

        setStats({
          total: data.total || 0,
          taken: data.taken || 0,
          missed: data.missed || 0,
          pending: data.pending || 0,
          adherence: data.adherence || 0,
          heatmapData: data.heatmapData || {}
        })
        setMedications(Array.isArray(data.medications)? data.medications : [])
      } catch (err) {
        console.error(err)
        setError('Failed to load analytics data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, user._id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="flex justify-center items-center h-">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="text-center text-red-600 mt-10">{error}</div>
    </div>
  )

  // Group meds by name to avoid duplicate bars
  const groupedMeds = medications.reduce((acc, med) => {
    const key = med.medicineName.trim()
    if (!acc[key]) acc[key] = { taken: 0, missed: 0, pending: 0, fullName: key }
    if (med.status === 'Taken') acc[key].taken++
    if (med.status === 'Missed') acc[key].missed++
    if (med.status === 'Pending') acc[key].pending++
    return acc
  }, {})

  const statusBarData = Object.values(groupedMeds).map(m => ({
    name: m.fullName.length > 12? m.fullName.substring(0, 10) + '...' : m.fullName,
    Taken: m.taken,
    Missed: m.missed,
    Pending: m.pending,
    fullName: m.fullName,
  }))

  const pieData = [
    { name: 'Taken', value: stats.taken },
    { name: 'Missed', value: stats.missed },
    { name: 'Pending', value: stats.pending },
  ].filter(d => d.value > 0);

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-500' }
    if (rate >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-500' }
    return { text: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-500' }
  }

  const adherenceColors = getAdherenceColor(stats.adherence)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12 transition-colors">
      <Navbar />

      {/* Heatmap CSS - Dark mode compatible */}
      <style>{`
        .react-calendar-heatmap .color-empty { 
          fill: var(--heatmap-empty, #ebedf0); 
        }
        .dark .react-calendar-heatmap .color-empty { 
          fill: #2d3748; 
        }
        .react-calendar-heatmap .color-scale-1 { fill: #a7f3d0; }
        .react-calendar-heatmap .color-scale-2 { fill: #6ee7b7; }
        .react-calendar-heatmap .color-scale-3 { fill: #34d399; }
        .react-calendar-heatmap .color-scale-4 { fill: #10b981; }
        .react-calendar-heatmap text { 
          font-size: 10px; 
          fill: #94a3b8; 
        }
        .dark .react-calendar-heatmap text { 
          fill: #64748b; 
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Pill className="text-teal-600" size={32} />
            Medication Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your adherence and medication history</p>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Meds', value: stats.total, icon: <Pill size={22} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { label: 'Taken', value: stats.taken, icon: <CheckCircle2 size={22} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
            { label: 'Missed', value: stats.missed, icon: <XCircle size={22} />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' },
            { label: 'Pending', value: stats.pending, icon: <Clock size={22} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
            { label: 'Adherence', value: `${stats.adherence}%`, icon: <TrendingUp size={22} />, color: adherenceColors.text, bg: adherenceColors.bg },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3 ${c.color}`}>{c.icon}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text- font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Overview */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h5 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Pill size={18} className="text-teal-600" />
              Status Overview
            </h5>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}
                  contentStyle={{
                    backgroundColor: 'rgb(15 23 42)',
                    border: '1px solid rgb(51 65 85)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                <Bar dataKey="Taken" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Missed" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
            <h5 className="font-bold text-slate-800 dark:text-white mb-2 self-start flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Dose Breakdown
            </h5>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={65} outerRadius={85} paddingAngle={8}>
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={COLORS[e.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(15 23 42)',
                    border: '1px solid rgb(51 65 85)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={`mt-4 px-4 py-2 rounded-full ${adherenceColors.bg} ${adherenceColors.text} text-sm font-bold`}>
              {stats.adherence}% Adherence Rate
            </div>
          </div>
        </div>

        {/* HEATMAP - Medical themed */}
        <div className="mt-8 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h5 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                <Calendar size={18} className="text-teal-600" />
                Medication History
              </h5>
              <p className="text-xs text-slate-400 dark:text-slate-500">Your daily dose consistency over the past year</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info size={14} />
              <span>Each square = 1 day</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mb-6 text-xs text-slate-600 dark:text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-200"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-300"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            </div>
            <span>More</span>
          </div>

          <div className="max-w-4xl mx-auto px-4 overflow-x-auto">
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={Object.entries(stats.heatmapData).map(([date, count]) => ({ date, count }))}
              classForValue={(value) => {
                if (!value || value.count === 0) return 'color-empty';
                if (value.count >= 4) return 'color-scale-4';
                if (value.count >= 3) return 'color-scale-3';
                if (value.count >= 2) return 'color-scale-2';
                return 'color-scale-1';
              }}
              tooltipDataAttrs={value => ({
                'data-tip': value.date? `${value.date}: ${value.count || 0} dose${value.count !== 1? 's' : ''} taken` : 'No data',
              })}
              showWeekdayLabels={true}
            />
          </div>

          // At the bottom of Analytics.jsx, before the closing </div>
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            
            <a href={`${API_URL}/api/medications/export-pdf?userId=${user._id}`}              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0d9488', color: 'white',
                padding: '10px 24px', borderRadius: 10,
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
              }}
            >
              📄 Export PDF Report
            </a>
          </div>
        </div>
      </div>
  );
};

export default Analytics;