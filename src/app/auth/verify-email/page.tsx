"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setErrorMsg('Token no encontrado en la URL')
      return
    }

    fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Token inválido o expirado')
        setStatus('success')
      })
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.message || 'Error al verificar el email')
      })
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>

        {status === 'loading' && (
          <div className="mt-8">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Verificando tu email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">Email verificado</p>
            <p className="text-xs text-gray-500 mt-1">Tu dirección de email ha sido confirmada correctamente.</p>
            <Link href="/dashboard" className="inline-block mt-6 text-sm text-indigo-600 font-medium hover:underline">
              Ir al dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-4">No pudimos verificar tu email</p>
            <p className="text-xs text-gray-500 mt-1">{errorMsg}</p>
            <Link href="/login" className="inline-block mt-6 text-sm text-indigo-600 font-medium hover:underline">
              Ir a iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
