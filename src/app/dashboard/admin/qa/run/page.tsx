"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { QaRunDetail } from '../_components/QaRunDetail'

function QaRunDetailInner() {
  const sp = useSearchParams()
  const id = sp.get('id') ?? ''

  if (!id) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/admin/qa"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          ← QA Runs
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">No se encontró el id del run.</p>
        </div>
      </div>
    )
  }

  return <QaRunDetail runId={id} />
}

export default function QaRunDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando…</div>}>
      <QaRunDetailInner />
    </Suspense>
  )
}
