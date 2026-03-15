'use client'
import React from 'react'
import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { notifications, removeNotification } = useAppStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onClose={(): void => { removeNotification(n.id) }} />
      ))}
    </div>
  )
}

function Toast({ notification, onClose }: { notification: any; onClose: () => void; key?: React.Key }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const icons = {
    success: <CheckCircle size={16} className="text-sf-green shrink-0" />,
    error:   <AlertCircle size={16} className="text-sf-red shrink-0" />,
    warning: <AlertTriangle size={16} className="text-sf-amber shrink-0" />,
    info:    <Info size={16} className="text-sf-cyan shrink-0" />,
  }

  const borders = {
    success: 'border-sf-green/30',
    error:   'border-sf-red/30',
    warning: 'border-sf-amber/30',
    info:    'border-sf-cyan/30',
  }

  return (
    <div
      className={cn(
        'glass rounded-xl p-3 pr-9 flex items-start gap-3 min-w-72 max-w-sm pointer-events-auto',
        'border animate-slide-up shadow-panel',
        borders[notification.type as keyof typeof borders] || 'border-sf-border'
      )}
    >
      {icons[notification.type as keyof typeof icons]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-sf-muted mt-0.5">{notification.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 text-sf-muted hover:text-sf-text transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
