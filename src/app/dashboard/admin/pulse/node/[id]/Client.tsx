"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity } from 'lucide-react'

import { getPulseState } from '../../_lib/api'
import type { PulseState, PulseResource } from '../../_lib/types'
import { PulseNodeDetail } from '../../_components/PulseNodeDetail'
import styles from '../../_styles/pulse.module.css'

export default function NodeDetailClient() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0]) : ''

  const [state, setState] = useState<PulseState | null>(null)
  const [resource, setResource] = useState<PulseResource | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPulseState().then((res) => {
      setState(res.data)
      const r = res.data.resources.find((x) => x.id === id) ?? null
      setResource(r)
      setLoading(false)
    })
  }, [id])

  function handleClose() {
    router.push('/dashboard/admin/pulse')
  }

  return (
    <div className={styles.shell}>
      <header className="relative z-20 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard/admin/pulse" className="text-xs text-slate-500 hover:text-indigo-300 transition shrink-0">
            ← Map
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-300" />
            <h1 className="text-base font-bold text-slate-100">Node detail</h1>
            <span className="text-xs text-slate-500 font-mono">{id}</span>
          </div>
        </div>
      </header>

      <div className={`flex-1 flex items-center justify-center px-4`}>
        {loading && (
          <div className={`${styles.glassStrong} px-6 py-4 rounded-2xl text-slate-300 text-sm`}>
            Cargando recurso…
          </div>
        )}
        {!loading && !resource && (
          <div className={`${styles.glassStrong} px-6 py-6 rounded-2xl text-center max-w-md`}>
            <div className="text-slate-200 font-semibold">Recurso no encontrado</div>
            <div className="text-slate-500 text-sm mt-1">No existe ningún resource con id <span className="font-mono text-indigo-300">{id}</span> en el snapshot actual.</div>
            <Link
              href="/dashboard/admin/pulse"
              className="inline-block mt-4 px-3 py-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 text-indigo-200 text-xs"
            >
              Volver al mapa
            </Link>
          </div>
        )}
      </div>

      {!loading && resource && state && (
        <PulseNodeDetail resource={resource} state={state} onClose={handleClose} />
      )}
    </div>
  )
}
