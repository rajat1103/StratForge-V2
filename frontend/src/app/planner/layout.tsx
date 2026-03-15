import React from 'react'
import { redirect } from 'next/navigation'
import { getSession, getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Providers } from '@/components/layout/Providers'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/auth/login')
  const user = await getCurrentUser(session)
  if (!user) redirect('/auth/login')
  const serializedUser = {
    id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, theme: user.theme,
    streak: user.streak
      ? { currentStreak: user.streak.currentStreak, longestStreak: user.streak.longestStreak, totalStudyDays: user.streak.totalStudyDays }
      : null,
  }
  return (
    <Providers user={serializedUser}>
      <div className="min-h-screen bg-sf-bg bg-grid">
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-sf-cyan/3 rounded-full blur-3xl pointer-events-none" />
        <Sidebar user={serializedUser} />
        <div className="lg:pl-56 transition-all duration-300">
          <TopBar user={serializedUser} />
          <main className="pt-14 min-h-screen">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </Providers>
  )
}
