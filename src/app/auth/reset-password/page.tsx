"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, KeyRound } from 'lucide-react'
import { useI18n } from '@/i18n'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [token, setToken] = useState<string | null>(null)

  // Request state
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  // Confirm state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token'))
  }, [])

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error al enviar el email')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error al actualizar la contraseña')
      }
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Icon */}
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">
              {token ? t('auth.resetPassword.newPassword') : t('auth.resetPassword.title')}
            </h1>
          </div>

          {/* ── Confirm flow (token in URL) ── */}
          {token ? (
            success ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
                <p className="text-sm text-gray-700 font-medium">{t('auth.resetPassword.resetSuccess')}</p>
                <Link href="/login" className="block text-sm text-indigo-600 font-semibold hover:underline">
                  {t('auth.resetPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleConfirm} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1.5 block">{t('auth.resetPassword.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1.5 block">{t('auth.resetPassword.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Repetí la contraseña"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.resetPassword.resetSubmit')}
                </button>
              </form>
            )
          ) : (
          /* ── Request flow (no token) ── */
            sent ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
                <p className="text-sm text-gray-700 font-medium">{t('auth.resetPassword.sent')}</p>
                <Link href="/login" className="block text-sm text-indigo-600 font-semibold hover:underline">
                  {t('auth.resetPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRequest} className="space-y-5">
                <p className="text-sm text-gray-500">
                  {t('auth.resetPassword.subtitle')}
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1.5 block">{t('auth.resetPassword.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.resetPassword.submit')}
                </button>
              </form>
            )
          )}

        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">{t('auth.resetPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
