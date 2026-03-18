"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import '@/lib/google.d.ts'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => initGoogle()
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  function initGoogle() {
    if (!window.google || !GOOGLE_CLIENT_ID) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      auto_select: false,
    })
    const btn = document.getElementById('google-btn-register')
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        shape: 'rectangular',
        width: '100%',
        logo_alignment: 'left',
      })
    }
  }

  async function handleGoogleCallback(response: { credential: string }) {
    setGoogleLoading(true)
    setError('')
    try {
      const { token, account } = await api.loginGoogle(response.credential)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(account))
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, account } = await api.register({ name, email, phone, password })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(account))
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="logo-runbits text-3xl mb-2">runbits</h1>
          <p className="text-slate-500 text-sm">Creá tu cuenta gratis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {GOOGLE_CLIENT_ID && (
            <>
              <div className={`transition-opacity ${googleLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div id="google-btn-register" className="w-full flex justify-center" />
              </div>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">o registrate con email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan García"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+54 11 1234-5678"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 px-4">
          Al registrarte aceptás los{' '}
          <a href="https://runbits.io#terms" className="underline hover:text-slate-600">Términos de servicio</a>
          {' '}y la{' '}
          <a href="https://runbits.io#privacy" className="underline hover:text-slate-600">Política de privacidad</a>.
        </p>
      </div>
    </div>
  )
}
