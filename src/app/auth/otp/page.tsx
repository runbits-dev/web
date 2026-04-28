"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

export default function OTPVerifyPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [sent, setSent] = useState(false)

  async function requestOTP() {
    if (!email) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      await res.json()
      setSent(true)
      setStep('verify')
      setStatus('idle')
    } catch {
      setErrorMsg(t('auth.otp.errorSend'))
      setStatus('error')
    }
  }

  async function verifyOTP() {
    if (!code || code.length !== 6) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('auth.otp.errorInvalid'))
      localStorage.setItem('token', data.token)
      setStatus('success')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.otp.errorVerify'))
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">Runbits</Link>
          <p className="text-sm text-gray-500 mt-2">{t('auth.otp.title')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {status === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-indigo-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-900 mt-4">{t('auth.otp.success')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('auth.otp.redirecting')}</p>
            </div>
          ) : step === 'request' ? (
            <>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('auth.otp.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                onKeyDown={e => e.key === 'Enter' && requestOTP()} />
              {errorMsg && <p className="text-sm text-red-500 mb-3">{errorMsg}</p>}
              <button onClick={requestOTP} disabled={status === 'loading' || !email}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.otp.sendCode')}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">{t('auth.otp.enterCode')} <span className="font-semibold">{email}</span></p>
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                onKeyDown={e => e.key === 'Enter' && verifyOTP()} />
              {errorMsg && <p className="text-sm text-red-500 mb-3">{errorMsg}</p>}
              <button onClick={verifyOTP} disabled={status === 'loading' || code.length !== 6}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.otp.verify')}
              </button>
              <button onClick={() => { setStep('request'); setCode(''); setErrorMsg('') }}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700">
                {t('auth.otp.resend')}
              </button>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">{t('auth.otp.backToLogin')}</Link>
        </p>
      </div>
    </main>
  )
}
