"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Zap, Database, Box, Inbox, Globe, Key, Layers,
} from 'lucide-react'
import type { ResourceType, DriftSeverity } from '../_lib/types'
import { RESOURCE_COLORS, RESOURCE_LABEL } from '../_lib/colors'
import styles from '../_styles/pulse.module.css'

export interface PulseNodeData extends Record<string, unknown> {
  resourceId: string
  type: ResourceType
  name: string
  driftCount: number
  driftSeverity: DriftSeverity | null
  selected?: boolean
  subtitle?: string
}

const ICONS: Record<ResourceType, typeof Zap> = {
  worker: Zap,
  d1: Database,
  kv: Layers,
  r2: Box,
  queue: Inbox,
  pages: Globe,
  secret: Key,
}

function PulseNodeImpl({ data, selected }: NodeProps) {
  const d = data as PulseNodeData
  const palette = RESOURCE_COLORS[d.type]
  const Icon = ICONS[d.type]
  const hasDrift = d.driftCount > 0

  const haloClass =
    hasDrift && d.driftSeverity === 'critical'
      ? styles.haloCritical
      : hasDrift && d.driftSeverity === 'warning'
        ? styles.haloWarning
        : hasDrift
          ? styles.haloInfo
          : ''

  return (
    <div
      className={`relative rounded-2xl ${haloClass}`}
      style={{
        width: 220,
        background: `linear-gradient(135deg, ${palette.bg}, rgba(15,23,42,0.85))`,
        border: `1px solid ${selected ? '#a5b4fc' : palette.border}`,
        boxShadow: selected
          ? `0 0 0 2px rgba(165,180,252,0.45), 0 12px 32px ${palette.glow}`
          : `0 8px 24px rgba(0,0,0,0.45), 0 0 24px ${palette.glow}`,
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        transition: 'transform 180ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: 40,
            height: 40,
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            color: palette.text,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold opacity-70"
              style={{ color: palette.text }}
            >
              {RESOURCE_LABEL[d.type]}
            </span>
            {hasDrift && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  d.driftSeverity === 'critical'
                    ? 'bg-red-500/20 text-red-200 border-red-400/40'
                    : d.driftSeverity === 'warning'
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                      : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${styles.liveDot} ${
                  d.driftSeverity === 'critical' ? 'bg-red-400' :
                  d.driftSeverity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                }`} />
                {d.driftCount} drift
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-100 truncate">{d.name}</div>
          {d.subtitle && (
            <div className="text-[11px] text-slate-400 truncate">{d.subtitle}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export const PulseNode = memo(PulseNodeImpl)
