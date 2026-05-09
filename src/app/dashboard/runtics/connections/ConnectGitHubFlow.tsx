"use client"

import { useEffect, useState } from 'react'
import { GitBranch, ExternalLink, X, Loader2 } from 'lucide-react'
import { runticsApi } from '../_lib'

/**
 * GitHub install wizard. Opens runtics-control's /connections/github/install
 * to fetch a stateful install URL, opens it in a new tab. The user installs
 * the App and gets redirected back to /dashboard/runtics/connections?connected=github
 * — at which point the parent page reloads connections list.
 */
export function ConnectGitHubFlow({ onClose }: { onClose: () => void }) {
  const [installUrl, setInstallUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await runticsApi.githubInstallUrl()
        if (!cancelled) setInstallUrl(res.install_url)
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Conectar GitHub</h3>
              <p className="text-xs text-slate-500">Instalá la GitHub App de Runtics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Vas a ser redirigido a GitHub para instalar la App de Runtics. Elegí qué
            organización o usuario y qué repos querés conectar.
          </p>
          <ol className="text-xs text-slate-500 space-y-1 ml-4 list-decimal">
            <li>Click en <span className="font-semibold">Instalar GitHub App</span> abajo</li>
            <li>Elegí cuenta + repos en GitHub</li>
            <li>GitHub te trae de vuelta acá automáticamente</li>
            <li>Vas a poder agregar webhooks por repo</li>
          </ol>
        </div>

        {error && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <a
            href={installUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!installUrl) {
                e.preventDefault()
                return
              }
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 ${
              installUrl
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                Instalar GitHub App
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </a>
        </div>
      </div>
    </div>
  )
}
