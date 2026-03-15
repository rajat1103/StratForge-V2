'use client'
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface WeeklyChartProps {
  data: Array<{ day: string; minutes: number; target: number }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg p-3 text-xs border border-sf-border/50">
      <p className="text-sf-cyan font-display font-semibold mb-1">{label}</p>
      <p className="text-sf-text">{payload[0].value}m studied</p>
      <p className="text-sf-muted">Target: {payload[0].payload.target}m</p>
    </div>
  )
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'var(--font-body)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.minutes >= entry.target
                ? '#00D4FF'
                : entry.minutes > 0
                ? 'rgba(0,212,255,0.4)'
                : 'rgba(30,45,74,0.8)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
