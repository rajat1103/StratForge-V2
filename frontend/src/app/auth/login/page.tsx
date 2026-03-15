'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => setForm({ email: 'demo@stratforge.app', password: 'password123' })

  return (
    <div className="min-h-screen bg-sf-bg bg-grid flex items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-sf-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 bg-sf-blue/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sf-cyan/20 to-sf-blue/20 border border-sf-cyan/30 mb-4">
            <Zap size={24} className="text-sf-cyan" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            STRAT<span className="text-sf-cyan">FORGE</span>
          </h1>
          <p className="text-sf-muted text-sm mt-1">AI-Powered Exam Preparation</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-sf-border/60 p-7 shadow-panel">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-white">Mission Login</h2>
            <p className="text-sf-muted text-sm mt-0.5">Access your preparation command center</p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-sf-red/10 border border-sf-red/30 text-sf-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-sf-muted mb-1.5">Email Address</label>
              <input
                type="email"
                className="sf-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-sf-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="sf-input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sf-muted hover:text-sf-text transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-4 p-3 rounded-xl bg-sf-panel/60 border border-sf-border/40">
            <p className="text-xs text-sf-muted text-center mb-2">Try the demo account</p>
            <button
              onClick={fillDemo}
              className="w-full text-xs text-sf-cyan hover:text-white transition-colors font-mono bg-sf-cyan/5 hover:bg-sf-cyan/10 border border-sf-cyan/20 rounded-lg px-3 py-1.5"
            >
              demo@stratforge.app / password123
            </button>
          </div>

          <p className="text-center text-sf-muted text-sm mt-5">
            New to StratForge?{' '}
            <Link href="/auth/register" className="text-sf-cyan hover:text-white transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          {['AI Study Plans', 'Progress Tracking', 'Claude Powered'].map(f => (
            <span
              key={f}
              className="text-xs text-sf-muted border border-sf-border/40 px-2.5 py-1 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
