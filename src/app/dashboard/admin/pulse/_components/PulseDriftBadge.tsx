"use client"

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { DriftSeverity } from '../_lib/types'
import { SEVERITY_COLORS } from '../_lib/colors'
import styles from '../_styles/pulse.module.css'

interface Props {
  severity: DriftSeverity
  count?: number
  label?: string
  size?: 'sm' | 'md'
  pulse?: boolean
}

const ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

export function PulseDriftBadge({ severity, count, label, size = 'md', pulse = true }: Props) {
  const palette = SEVERITY_COLORS[severity]
  const Icon = ICONS[severity]
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full border font-semibold ${palette.pill}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${styles.liveDot}`}
          style={{ background: palette.border }}
        />
      )}
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {count !== undefined && <span>{count}</span>}
      {label && <span className="font-medium opacity-90">{label}</span>}
    </span>
  )
}
