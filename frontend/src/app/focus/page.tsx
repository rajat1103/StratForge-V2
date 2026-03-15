'use client'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Check, Zap, Coffee, Brain } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn, formatMinutes } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

type TimerMode = 'focus' | 'short_break' | 'long_break'

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode }> = {
  focus:       { label: 'Focus',       minutes: 25, color: '#00D4FF', icon: <Brain size={14} /> },
  short_break: { label: 'Short Break', minutes: 5,  color: '#00FF9C', icon: <Coffee size={14} /> },
  long_break:  { label: 'Long Break',  minutes: 15, color: '#FFB347', icon: <Coffee size={14} /> },
}

export default function FocusPage() {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [sessionScore, setSessionScore] = useState(75)
  const [loggedToday, setLoggedToday] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qc = useQueryClient()
  const { addNotification } = useAppStore()

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then(r => r.json()),
  })

  const allTopics = examsData?.data?.flatMap((e: any) =>
    (e.topics || []).map((t: any) => ({ ...t, examTitle: e.title, examColor: e.colorAccent }))
  ) || []

  useEffect(() => {
    setSecondsLeft(MODES[mode as TimerMode].minutes * 60)
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            handleTimerComplete()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const handleTimerComplete = async () => {
    if (mode === 'focus') {
      setCompleted(c => c + 1)
      setLoggedToday(l => l + MODES.focus.minutes)
      if (selectedTopicId) {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId: selectedTopicId,
            score: sessionScore,
            minutesSpent: MODES.focus.minutes,
            sessionType: 'study',
          }),
        })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }
      addNotification({ id: Date.now().toString(), type: 'success', title: 'Pomodoro complete! 🎯', message: 'Take a short break' })
    }
  }

  const reset = () => {
    setRunning(false)
    setSecondsLeft(MODES[mode as TimerMode].minutes * 60)
  }

  const total = MODES[mode as TimerMode].minutes * 60
  const progress = ((total - secondsLeft) / total) * 100
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const { color } = MODES[mode as TimerMode]

  const r = 110
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Mode selector */}
      <div className="glass rounded-2xl border border-sf-border/50 p-1.5 flex gap-1">
        {(Object.entries(MODES) as [TimerMode, typeof MODES[TimerMode]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
              mode === key
                ? 'text-white'
                : 'text-sf-muted hover:text-sf-text'
            )}
            style={mode === key ? { background: `${val.color}18`, color: val.color } : {}}
          >
            {val.icon}
            <span className="hidden sm:inline">{val.label}</span>
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="glass rounded-2xl border border-sf-border/50 p-8 flex flex-col items-center gap-6">
        <div className="relative">
          <svg width={260} height={260} className="rotate-[-90deg]">
            {/* Track */}
            <circle cx={130} cy={130} r={r} fill="none" stroke="rgba(30,45,74,0.8)" strokeWidth={10} />
            {/* Progress */}
            <circle
              cx={130} cy={130} r={r}
              fill="none"
              stroke={color}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 0.9s linear',
                filter: `drop-shadow(0 0 12px ${color}60)`,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-5xl font-bold tracking-wider" style={{ color }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </p>
            <p className="text-sf-muted text-sm mt-1">{MODES[mode as TimerMode].label}</p>
            {running && (
              <div className="flex gap-1 mt-2">
                {[0,1,2].map(i => (
                  <div
                    key={i}
                    className="w-1 rounded-full animate-pulse"
                    style={{ height: 6 + i * 2, background: color, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="w-11 h-11 rounded-full glass border border-sf-border/50 flex items-center justify-center text-sf-muted hover:text-sf-text transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-sf-bg transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 24px ${color}50` }}
          >
            {running ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
          </button>
          <div className="w-11 h-11 rounded-full glass border border-sf-border/50 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-sm" style={{ color }}>{completed}</span>
            <span className="text-xs text-sf-muted">done</span>
          </div>
        </div>

        {/* Today stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-display text-lg font-bold text-sf-cyan">{completed}</p>
            <p className="text-xs text-sf-muted">Pomodoros</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-bold text-sf-green">{formatMinutes(loggedToday)}</p>
            <p className="text-xs text-sf-muted">Focused today</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-bold text-sf-amber">{formatMinutes(completed * 25)}</p>
            <p className="text-xs text-sf-muted">Total time</p>
          </div>
        </div>
      </div>

      {/* Topic selection */}
      <div className="glass rounded-2xl border border-sf-border/50 p-4">
        <p className="text-sm font-display font-bold text-white mb-3">STUDYING RIGHT NOW</p>
        {allTopics.length === 0 ? (
          <p className="text-sf-muted text-sm">Add exams and topics to track focus sessions</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => setSelectedTopicId(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl text-sm border transition-all',
                !selectedTopicId
                  ? 'bg-sf-panel border-sf-cyan/30 text-sf-cyan'
                  : 'border-sf-border/40 text-sf-muted hover:text-sf-text hover:border-sf-border'
              )}
            >
              Free session (no topic)
            </button>
            {allTopics.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-xl text-sm border transition-all flex items-center justify-between',
                  selectedTopicId === t.id
                    ? 'border-opacity-50 text-white'
                    : 'border-sf-border/40 text-sf-muted hover:text-sf-text hover:border-sf-border'
                )}
                style={selectedTopicId === t.id
                  ? { borderColor: t.examColor, background: `${t.examColor}10` }
                  : {}}
              >
                <span>{t.title}</span>
                <span className="text-xs opacity-60">{t.examTitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confidence slider */}
      {selectedTopicId && mode === 'focus' && (
        <div className="glass rounded-2xl border border-sf-border/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-display font-bold text-white">SESSION CONFIDENCE</p>
            <span className="text-sf-cyan font-mono text-sm">{sessionScore}%</span>
          </div>
          <input
            type="range" min={10} max={100} step={5}
            value={sessionScore}
            onChange={e => setSessionScore(+e.target.value)}
            className="w-full accent-sf-cyan"
          />
          <div className="flex justify-between text-xs text-sf-muted mt-1">
            <span>Lost</span><span>Okay</span><span>Mastered</span>
          </div>
        </div>
      )}
    </div>
  )
}
