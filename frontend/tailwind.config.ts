import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          bg:       '#080C14',
          surface:  '#0D1425',
          panel:    '#111A2E',
          border:   '#1E2D4A',
          cyan:     '#00D4FF',
          blue:     '#0066FF',
          green:    '#00FF9C',
          amber:    '#FFB347',
          red:      '#FF4466',
          purple:   '#9B6DFF',
          text:     '#E2E8F0',
          muted:    '#64748B',
          dim:      '#334155',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        'glow-cyan':    'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'glow-blue':    'radial-gradient(ellipse at center, rgba(0,102,255,0.15) 0%, transparent 70%)',
        'hero-gradient':'linear-gradient(135deg, #080C14 0%, #0D1F3C 50%, #080C14 100%)',
      },
      backgroundSize: { grid: '40px 40px' },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(0,212,255,0.3)',
        'glow-md':  '0 0 20px rgba(0,212,255,0.4)',
        'glow-lg':  '0 0 40px rgba(0,212,255,0.3)',
        'panel':    '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card':     '0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':        'scan 4s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'number-tick': 'numberTick 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        numberTick: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
