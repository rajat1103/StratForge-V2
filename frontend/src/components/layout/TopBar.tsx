'use client'
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Flame, Menu, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Mission Control',
  '/exam':       'My Exams',
  '/planner':    'Study Planner',
  '/analytics':  'Analytics',
  '/focus':      'Focus Mode',
  '/assistant':  'AI Assistant',
}

interface TopBarProps {
  user?: { name?: string | null; streak?: { currentStreak: number } | null }
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const { setSidebarOpen, sidebarOpen } = useAppStore()

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'StratForge'

  // Fix: compute date only on client to avoid hydration mismatch
  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    setDateStr(format(new Date(), 'EEEE, MMMM d, yyyy'))
  }, [])

  const { data: insightsData } = useQuery({
    queryKey: ['insights-count'],
    queryFn: async () => {
      const r = await fetch('/api/insights')
      const j = await r.json()
      return j.unread as number
    },
    refetchInterval: 60_000,
  })

  const streak = user?.streak?.currentStreak || 0

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-56 h-14 z-30 glass border-b border-sf-border/40 transition-all duration-300">
      <div className="flex items-center h-full px-4 gap-4">
        {/* Mobile menu */}
        <button
          className="lg:hidden text-sf-muted hover:text-sf-cyan transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={18} />
        </button>

        {/* Page title */}
        <div className="flex-1">
          <h1 className="font-display text-lg font-semibold text-white tracking-wide">{title}</h1>
          {dateStr && (
            <p className="text-xs text-sf-muted hidden sm:block">{dateStr}</p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Live clock - client only to avoid hydration mismatch */}
          <div className="hidden md:flex items-center gap-1.5 text-sf-muted text-xs font-mono">
            <Clock size={12} />
            <LiveClock />
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sf-amber/10 border border-sf-amber/20">
              <Flame size={13} className="text-sf-amber" />
              <span className="text-xs font-display font-semibold text-sf-amber">{streak}</span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sf-panel transition-colors text-sf-muted hover:text-sf-cyan">
            <Bell size={16} />
            {(insightsData || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-sf-red rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

// Renders empty on server, fills in on client — prevents hydration mismatch
function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    // Set immediately on mount
    setTime(format(new Date(), 'HH:mm:ss'))
    const t = setInterval(() => setTime(format(new Date(), 'HH:mm:ss')), 1000)
    return () => clearInterval(t)
  }, [])

  // Returns empty string on server render — no mismatch possible
  if (!time) return null
  return <span>{time}</span>
}
