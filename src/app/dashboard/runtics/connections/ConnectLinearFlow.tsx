"use client"

import { useState } from 'react'
import { X, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { runticsApi } from '../_lib'

export function ConnectLinearFlow({ onClose, onConnected }: { onClose: () => void; onConnected?: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ organization: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await runticsApi.connectLinear({
        api_key: apiKey.trim(),
        display_name: displayName.trim() || undefined,
      })
      setSuccess({ organization: result.organization })
      onConnected?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Conectar Linear</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">¡Conectado!</p>
            <p className="text-sm text-slate-500 mb-6">
              Linear de <span className="font-medium">{success.organization}</span> ya está disponible
              para tus agents.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <p className="mb-2">Linear usa API keys personales. Generala desde:</p>
              <a
                href="https://linear.app/settings/api"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                linear.app/settings/api <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Personal API key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="lin_api_…"
                required
                autoFocus
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Mi Linear"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !apiKey.trim()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? 'Validando…' : 'Conectar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
