'use client'
import React from 'react'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full glass rounded-2xl border border-sf-border/60 shadow-panel animate-slide-up',
          sizes[size]
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-5 pb-4 border-b border-sf-border/40">
            {title && (
              <h2 className="font-display text-xl font-bold text-white tracking-wide">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-sf-muted mt-1">{description}</p>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-sf-muted hover:text-sf-text hover:bg-sf-panel transition-all"
        >
          <X size={15} />
        </button>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
