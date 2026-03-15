'use client'
import React, { useState, useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'
import { Toaster } from '@/components/ui/Toaster'

interface ProvidersProps {
  children?: React.ReactNode
  user?: {
    id: string
    email: string
    name?: string | null
    streak?: { currentStreak: number; longestStreak: number; totalStudyDays: number } | null
  } | null
}

export function Providers({ children, user }: ProvidersProps) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }))
  const { setUser } = useAppStore()
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current && user) {
      setUser(user as any)
      hydrated.current = true
    }
  }, [user, setUser])

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
