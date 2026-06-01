"use client"

import { useParams } from 'next/navigation'
import Link from 'next/link'

import { QaRunDetail } from '../_components/QaRunDetail'

export default function QaRunDetailClient() {
  const params = useParams<{ id: string }>()
  const raw = params?.id
  const id =
    typeof raw === 'string'
      ? decodeURIComponent(raw)
      : Array.isArray(raw)
        ? decodeURIComponent(raw[0])
        : ''

  // Avoid rendering against the static-export placeholder.
  if (!id || id === 'placeholder') {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/admin/qa"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          ← QA Runs
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">Esperando id de run…</p>
        </div>
      </div>
    )
  }

  return <QaRunDetail runId={id} />
}
