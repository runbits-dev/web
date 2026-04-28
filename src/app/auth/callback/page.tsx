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
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error) {
      setStatus('error')
      const messages: Record<string, string> = {
        facebook_denied: 'Cancelaste el login con Facebook',
        facebook_missing_code: 'No se recibió el código de Facebook',
        facebook_failed: 'Error al autenticar con Facebook',
        account_inactive: 'Tu cuenta está inactiva',
      }
      setErrorMsg(messages[error] || 'Error de autenticación')
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMsg('No se recibió el token de autenticación')
      return
    }

    localStorage.setItem('token', token)
    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 1000)
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
