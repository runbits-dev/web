"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      setStatus('error')
      const messages: Record<string, string> = {
        facebook_denied: 'Cancelaste el login con Facebook',
        facebook_missing_code: 'No se recibió el código de Facebook',
        facebook_failed: 'Error al autenticar con Facebook',
        google_failed: 'Error al autenticar con Google',
        google_denied: 'Cancelaste el login con Google',
        account_inactive: 'Tu cuenta está inactiva',
      }
      setErrorMsg(messages[error] || 'Error de autenticación')
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
      setErrorMsg('No se recibió el código de autenticación')
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
        setErrorMsg('Error al procesar la autenticación. Intentá de nuevo.')
      })
  }, [router])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>

        {status === 'loading' && (
          <div className="mt-8">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Procesando...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">Sesión iniciada</p>
            <p className="text-xs text-gray-500 mt-1">Redirigiendo al dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">{errorMsg}</p>
            <Link href="/login" className="inline-block mt-6 text-sm text-indigo-600 font-medium hover:underline">
              Volver al login
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
