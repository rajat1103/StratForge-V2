'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Calendar, BarChart3,
  Focus, Bot, LogOut, Menu, X, Zap, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/exam',       label: 'My Exams',   icon: BookOpen },
  { href: '/planner',    label: 'Planner',     icon: Calendar },
  { href: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/focus',      label: 'Focus Mode',  icon: Focus },
  { href: '/assistant',  label: 'AI Assistant',icon: Bot },
]

interface SidebarProps {
  user?: { name?: string | null; email: string } | null
  unreadInsights?: number
}

export function Sidebar({ user, unreadInsights = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email[0].toUpperCase() || 'U'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300',
          'glass border-r border-sf-border/60',
          sidebarOpen ? 'w-56' : 'w-14',
          'lg:translate-x-0',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-sf-border/40 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sf-cyan to-sf-blue flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-display text-lg font-bold text-white tracking-wide">
              STRAT<span className="text-sf-cyan">FORGE</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-sf-muted hover:text-sf-cyan transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-150 group relative',
                  active
                    ? 'bg-sf-cyan/10 text-sf-cyan'
                    : 'text-sf-muted hover:bg-sf-panel hover:text-sf-text'
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'shrink-0 transition-all',
                    active && 'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]'
                  )}
                />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{label}</span>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sf-cyan rounded-r-full" />
                )}
                {!sidebarOpen && label === 'AI Assistant' && unreadInsights > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-sf-red rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sf-border/40 p-2 shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sf-cyan/30 to-sf-blue/30 border border-sf-cyan/30 flex items-center justify-center text-xs text-sf-cyan font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sf-text truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-sf-muted truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sf-muted hover:bg-sf-red/10 hover:text-sf-red transition-all"
          >
            <LogOut size={16} className="shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button for desktop */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 w-8 h-8 glass rounded-lg flex items-center justify-center text-sf-muted hover:text-sf-cyan transition-all lg:hidden"
      >
        <Menu size={16} />
      </button>
    </>
  )
}
