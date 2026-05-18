"use client"

import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'sky'
  trend?: { delta: number; positive?: boolean }
}

const ACCENTS: Record<NonNullable<KPICardProps['accent']>, { glow: string; text: string; border: string }> = {
  indigo:  { glow: 'rgba(99,102,241,0.35)',  text: '#c7d2fe', border: 'rgba(129,140,248,0.35)' },
  emerald: { glow: 'rgba(16,185,129,0.35)',  text: '#a7f3d0', border: 'rgba(52,211,153,0.35)' },
  amber:   { glow: 'rgba(245,158,11,0.35)',  text: '#fde68a', border: 'rgba(251,191,36,0.35)' },
  red:     { glow: 'rgba(239,68,68,0.4)',    text: '#fecaca', border: 'rgba(248,113,113,0.4)' },
  violet:  { glow: 'rgba(139,92,246,0.35)',  text: '#ddd6fe', border: 'rgba(167,139,250,0.35)' },
  sky:     { glow: 'rgba(56,189,248,0.35)',  text: '#bae6fd', border: 'rgba(125,211,252,0.35)' },
}

export function KPICard({ icon: Icon, label, value, hint, accent = 'indigo', trend }: KPICardProps) {
  const palette = ACCENTS[accent]
  return (
    <div
      className="rounded-xl p-3 transition-all hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.65), rgba(2,6,23,0.85))',
        border: `1px solid ${palette.border}`,
        boxShadow: `0 0 24px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color: palette.text }} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold" style={{ color: palette.text }}>{value}</span>
        {trend && (
          <span className={`text-[10px] font-semibold ${trend.positive !== false ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.delta > 0 ? '+' : ''}{trend.delta}
          </span>
        )}
      </div>
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  )
}
