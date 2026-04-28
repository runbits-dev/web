"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      setStatus('error')
      const messages: Record<string, string> = {
        facebook_denied: t('login.errorFacebookDenied'),
        facebook_missing_code: t('auth.callback.errorNoCode'),
        facebook_failed: t('login.errorFacebookFailed'),
        google_failed: t('login.errorGoogleFailed'),
        google_denied: t('login.errorGoogleDenied'),
        account_inactive: t('login.errorAccountInactive'),
      }
      setErrorMsg(messages[error] || t('login.errorAuth'))
      return
    }

    const requires2FA = params.get('requires2FA')
    const tempToken = params.get('tempToken')

    if (requires2FA === 'true' && tempToken) {
      router.replace(`/login?needs2FA=true&tempToken=${encodeURIComponent(tempToken)}`)
      return
    }

    const code = params.get('code')
    if (!code) {
      setStatus('error')
      setErrorMsg(t('auth.callback.errorNoCode'))
      return
    }

    fetch(`${API_BASE}/api/auth/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        localStorage.setItem('token', data.token)
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 500)
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg(t('auth.callback.errorProcessing'))
      })
  }, [router, t])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>

        {status === 'loading' && (
          <div className="mt-8">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">{t('auth.callback.processing')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">{t('auth.callback.success')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('auth.callback.redirecting')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">{errorMsg}</p>
            <Link href="/login" className="inline-block mt-6 text-sm text-indigo-600 font-medium hover:underline">
              {t('auth.callback.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
