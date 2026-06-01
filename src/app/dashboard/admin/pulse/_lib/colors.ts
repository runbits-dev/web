// Centralized colour scheme for Pulse — tuned for dark mode + glassmorphism.

import type { ResourceType, EdgeType, DriftSeverity } from './types'

export const RESOURCE_COLORS: Record<ResourceType, { bg: string; border: string; glow: string; text: string; chip: string }> = {
  worker: {
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(129, 140, 248, 0.55)',
    glow: 'rgba(99, 102, 241, 0.45)',
    text: '#c7d2fe',
    chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  },
  d1: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(52, 211, 153, 0.55)',
    glow: 'rgba(16, 185, 129, 0.45)',
    text: '#a7f3d0',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  },
  kv: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(251, 191, 36, 0.55)',
    glow: 'rgba(245, 158, 11, 0.45)',
    text: '#fde68a',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  },
  r2: {
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(244, 114, 182, 0.55)',
    glow: 'rgba(236, 72, 153, 0.45)',
    text: '#fbcfe8',
    chip: 'bg-pink-500/15 text-pink-300 border-pink-400/30',
  },
  queue: {
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(167, 139, 250, 0.55)',
    glow: 'rgba(139, 92, 246, 0.45)',
    text: '#ddd6fe',
    chip: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  },
  pages: {
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(125, 211, 252, 0.55)',
    glow: 'rgba(56, 189, 248, 0.45)',
    text: '#bae6fd',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  },
  secret: {
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(251, 113, 133, 0.55)',
    glow: 'rgba(244, 63, 94, 0.45)',
    text: '#fecdd3',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  },
  zone: {
    bg: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(45, 212, 191, 0.55)',
    glow: 'rgba(20, 184, 166, 0.45)',
    text: '#99f6e4',
    chip: 'bg-teal-500/15 text-teal-300 border-teal-400/30',
  },
}

export const EDGE_COLORS: Record<EdgeType, { stroke: string; label: string }> = {
  service_binding: { stroke: '#818cf8', label: 'Service' },
  d1_binding: { stroke: '#34d399', label: 'D1' },
  kv_binding: { stroke: '#fbbf24', label: 'KV' },
  r2_binding: { stroke: '#f472b6', label: 'R2' },
  queue_producer: { stroke: '#a78bfa', label: 'Queue→' },
  queue_consumer: { stroke: '#8b5cf6', label: '←Queue' },
  webhook: { stroke: '#fb923c', label: 'Webhook' },
  frontend_call: { stroke: '#38bdf8', label: 'HTTP' },
}

export const SEVERITY_COLORS: Record<DriftSeverity, { bg: string; border: string; text: string; pill: string; ring: string }> = {
  critical: {
    bg: 'rgba(239, 68, 68, 0.18)',
    border: '#f87171',
    text: '#fecaca',
    pill: 'bg-red-500/20 text-red-300 border-red-400/40',
    ring: 'rgba(248, 113, 113, 0.55)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.18)',
    border: '#fbbf24',
    text: '#fde68a',
    pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    ring: 'rgba(251, 191, 36, 0.55)',
  },
  info: {
    bg: 'rgba(56, 189, 248, 0.18)',
    border: '#7dd3fc',
    text: '#bae6fd',
    pill: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    ring: 'rgba(125, 211, 252, 0.55)',
  },
}

export const RESOURCE_LABEL: Record<ResourceType, string> = {
  worker: 'Worker',
  d1: 'D1',
  kv: 'KV',
  r2: 'R2',
  queue: 'Queue',
  pages: 'Pages',
  secret: 'Secret',
  zone: 'Zone',
}
