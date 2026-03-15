'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Clock, Target, Flame, Award } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { MasteryHeatmap } from '@/components/charts/MasteryHeatmap'
import { formatMinutes } from '@/lib/utils'
import { format, subDays } from 'date-fns'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(13,20,37,0.95)',
    border: '1px solid rgba(30,45,74,0.8)',
    borderRadius: 10,
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
  },
  itemStyle: { color: '#00D4FF' },
  labelStyle: { color: '#64748B', marginBottom: 4 },
}

export default function AnalyticsPage() {
  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json()),
  })

  const { data: progressData } = useQuery({
    queryKey: ['progress-30'],
    queryFn: () => fetch('/api/progress?days=30').then(r => r.json()),
  })

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then(r => r.json()),
  })

  const stats = dashData?.data
  const logs = progressData?.data || []
  const exams = examsData?.data || []

  // Build 30-day activity chart
  const thirtyDayData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayLogs = logs.filter((l: any) =>
      format(new Date(l.logDate), 'yyyy-MM-dd') === dateStr
    )
    const minutes = dayLogs.reduce((s: number, l: any) => s + l.minutesSpent, 0)
    const avgScore = dayLogs.length
      ? Math.round(dayLogs.reduce((s: number, l: any) => s + l.score, 0) / dayLogs.length)
      : 0
    return { date: format(date, 'MMM d'), minutes, score: avgScore }
  })

  // Per-exam radar data
  const radarData = exams.map((e: any) => ({
    exam: e.title.slice(0, 12),
    completion: e.completionPct,
    topics: Math.min(100, ((e.topics?.length || 0) / 15) * 100),
    mastery: Math.round(
      (e.topics || []).reduce((s: number, t: any) => s + t.masteryLevel, 0) /
      Math.max(1, (e.topics || []).length) * 100
    ),
  }))

  // Session type breakdown
  const sessionTypes = ['study', 'revision', 'practice'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: logs.filter((l: any) => l.sessionType === type).length,
    minutes: logs.filter((l: any) => l.sessionType === type)
      .reduce((s: number, l: any) => s + l.minutesSpent, 0),
  }))

  const totalMinutes = logs.reduce((s: number, l: any) => s + l.minutesSpent, 0)
  const avgDailyMinutes = Math.round(totalMinutes / 30)
  const avgScore = logs.length
    ? Math.round(logs.reduce((s: number, l: any) => s + l.score, 0) / logs.length)
    : 0
  const studyDays = new Set(logs.map((l: any) => format(new Date(l.logDate), 'yyyy-MM-dd'))).size

  const SESSION_COLORS = ['#00D4FF', '#FFB347', '#00FF9C']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Study Time"
          value={formatMinutes(totalMinutes)}
          icon={<Clock size={14} />}
          color="#00D4FF"
          subvalue="last 30 days"
        />
        <StatCard
          label="Daily Average"
          value={formatMinutes(avgDailyMinutes)}
          icon={<TrendingUp size={14} />}
          color="#00FF9C"
          subvalue="per active day"
        />
        <StatCard
          label="Avg Confidence"
          value={`${avgScore}%`}
          icon={<Target size={14} />}
          color="#FFB347"
          subvalue="self-assessed"
        />
        <StatCard
          label="Active Days"
          value={studyDays}
          icon={<Flame size={14} />}
          color="#FF4466"
          subvalue={`of 30 (${Math.round(studyDays / 30 * 100)}% consistency)`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left col: 2/3 */}
        <div className="xl:col-span-2 space-y-5">

          {/* 30-day activity */}
          <div className="glass rounded-2xl border border-sf-border/50 p-5">
            <h2 className="font-display text-sm font-bold text-white tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-sf-cyan rounded-full" />
              30-DAY STUDY ACTIVITY
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={thirtyDayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="minutesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={6}
                />
                <YAxis hide />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: any) => [`${v}m`, 'Study time']}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  fill="url(#minutesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence trend */}
          <div className="glass rounded-2xl border border-sf-border/50 p-5">
            <h2 className="font-display text-sm font-bold text-white tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-sf-green rounded-full" />
              CONFIDENCE TREND
            </h2>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={thirtyDayData.filter(d => d.score > 0)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF9C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF9C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={5}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: any) => [`${v}%`, 'Confidence']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00FF9C"
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Topic mastery heatmap */}
          <div className="glass rounded-2xl border border-sf-border/50 p-5">
            <h2 className="font-display text-sm font-bold text-white tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-sf-purple rounded-full" />
              TOPIC MASTERY MAP
            </h2>
            <MasteryHeatmap data={stats?.topicHeatmap || []} />
          </div>
        </div>

        {/* Right col: 1/3 */}
        <div className="space-y-4">

          {/* Session breakdown */}
          <div className="glass rounded-2xl border border-sf-border/50 p-4">
            <h3 className="font-display text-sm font-bold text-white tracking-wide mb-3 flex items-center gap-2">
              <Award size={14} className="text-sf-amber" />
              SESSION BREAKDOWN
            </h3>
            <div className="space-y-3">
              {sessionTypes.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-sf-muted">{s.name}</span>
                    <span style={{ color: SESSION_COLORS[i] }} className="font-mono">
                      {s.value} sessions · {formatMinutes(s.minutes)}
                    </span>
                  </div>
                  <div className="mastery-bar">
                    <div
                      className="mastery-bar-fill"
                      style={{
                        width: `${Math.round(s.minutes / Math.max(1, totalMinutes) * 100)}%`,
                        background: SESSION_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar: exam comparison */}
          {radarData.length > 0 && (
            <div className="glass rounded-2xl border border-sf-border/50 p-4">
              <h3 className="font-display text-sm font-bold text-white tracking-wide mb-3">
                EXAM COMPARISON
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(30,45,74,0.8)" />
                  <PolarAngleAxis
                    dataKey="exam"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                  />
                  <Radar
                    name="Completion"
                    dataKey="completion"
                    stroke="#00D4FF"
                    fill="#00D4FF"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="#00FF9C"
                    fill="#00FF9C"
                    fillOpacity={0.1}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-1">
                <span className="flex items-center gap-1 text-xs text-sf-muted">
                  <span className="w-2 h-2 rounded-full bg-sf-cyan inline-block" />Completion
                </span>
                <span className="flex items-center gap-1 text-xs text-sf-muted">
                  <span className="w-2 h-2 rounded-full bg-sf-green inline-block" />Mastery
                </span>
              </div>
            </div>
          )}

          {/* Weekly bar */}
          <div className="glass rounded-2xl border border-sf-border/50 p-4">
            <h3 className="font-display text-sm font-bold text-white tracking-wide mb-3">THIS WEEK</h3>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart
                data={stats?.weeklyProgress || []}
                barSize={16}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: any) => [`${v}m`, '']}
                />
                <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
                  {(stats?.weeklyProgress || []).map((entry: any, i: number) => (
                    <Cell
                      key={i}
                      fill={entry.minutes >= entry.target ? '#00D4FF' : 'rgba(0,212,255,0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
