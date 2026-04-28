"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export default function MagicLinkPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setError('')
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Error al enviar el link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Revisá tu email</h2>
              <p className="text-sm text-gray-500 mt-2">Si el email está registrado, te enviamos un link de acceso a <span className="font-medium text-gray-900">{email}</span></p>
              <p className="text-xs text-gray-400 mt-6">No llegó? Revisá spam o <button onClick={() => setSent(false)} className="text-indigo-600 hover:underline">volvé a intentar</button></p>
              <Link href="/login" className="inline-block mt-4 text-sm text-indigo-600 font-medium hover:underline">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Volver al login
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar acceso</h1>
              <p className="text-sm text-gray-500 mb-6">Te enviamos un link para ingresar sin contraseña.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1.5 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="tu@email.com" autoComplete="email" autoFocus />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading || !email}
                  className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar link de acceso'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
