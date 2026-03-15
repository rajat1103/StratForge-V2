'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const passwordChecks = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'Contains a letter',     ok: /[a-zA-Z]/.test(form.password) },
    { label: 'Contains a number',     ok: /\d/.test(form.password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      router.push('/auth/onboarding')
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sf-bg bg-grid flex items-center justify-center p-4">
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-sf-purple/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/4 w-72 h-72 bg-sf-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sf-cyan/20 to-sf-blue/20 border border-sf-cyan/30 mb-4">
            <Zap size={24} className="text-sf-cyan" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            STRAT<span className="text-sf-cyan">FORGE</span>
          </h1>
          <p className="text-sf-muted text-sm mt-1">Begin your preparation mission</p>
        </div>

        <div className="glass rounded-2xl border border-sf-border/60 p-7 shadow-panel">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-white">Create Account</h2>
            <p className="text-sf-muted text-sm mt-0.5">Set up your personal study command center</p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-sf-red/10 border border-sf-red/30 text-sf-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-sf-muted mb-1.5">Full Name</label>
              <input
                type="text"
                className="sf-input"
                placeholder="Alex Chen"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-sf-muted mb-1.5">Email Address</label>
              <input
                type="email"
                className="sf-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-sf-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="sf-input pr-10"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sf-muted hover:text-sf-text transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map(c => (
                    <div key={c.label} className="flex items-center gap-1.5">
                      <Check size={11} className={c.ok ? 'text-sf-green' : 'text-sf-border'} />
                      <span className={`text-xs ${c.ok ? 'text-sf-green' : 'text-sf-muted'}`}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordChecks.every(c => c.ok)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Launch My Account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sf-muted text-sm mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-sf-cyan hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
