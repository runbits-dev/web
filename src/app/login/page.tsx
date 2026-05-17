"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Loader2, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { useI18n } from '@/i18n'
import { loginWithPasskey, isPasskeySupported } from '@/lib/webauthn'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'
const FACEBOOK_APP_ID = '896485670109777'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPasskeyEmail, setShowPasskeyEmail] = useState(false)
  const [passkeyEmail, setPasskeyEmail] = useState('')
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const googleInitialized = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      const messages: Record<string, string> = {
        facebook_denied: t('login.errorFacebookDenied'),
        facebook_failed: t('login.errorFacebookFailed'),
        google_failed: t('login.errorGoogleFailed'),
        google_denied: t('login.errorGoogleDenied'),
        account_inactive: t('login.errorAccountInactive'),
      }
      setError(messages[err] || t('login.errorAuth'))
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      const google = (window as any).google
      if (!google) return
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        // Force traditional popup. FedCM can be disabled by user/browser
        // settings and silently fails — never fall back to it.
        use_fedcm_for_prompt: false,
      })
      // Render the official Google button which ALWAYS shows the account
      // chooser popup on click (prompt() only surfaces the One Tap UI which
      // picks the primary browser account silently). The hidden container is
      // rendered offscreen — our custom button delegates the click to it.
      const container = document.getElementById('google-signin-hidden')
      if (container) {
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
        })
      }
      googleInitialized.current = true
    }
    document.head.appendChild(script)
  }, [])

  async function handleGoogleCallback(response: { credential: string }) {
    setSocialLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('login.errorGoogleFailed'))
      if (data.requires2FA) {
        setNeeds2FA(true)
        setTempToken(data.tempToken)
        setSocialLoading(false)
        return
      }
      localStorage.setItem('token', data.token)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.errorGoogleFailed'))
      setSocialLoading(false)
    }
  }

  function triggerGoogle() {
    // Click the hidden Google-rendered button. Its click handler opens the
    // account chooser popup (different code path from prompt() which only
    // surfaces One Tap with no chooser).
    const hidden = document.getElementById('google-signin-hidden')
    const btn = hidden?.querySelector('[role="button"]') as HTMLElement | null
    if (btn) {
      btn.click()
      return
    }
    // Fallback to One Tap if the rendered button isn't ready yet (rare).
    if ((window as any).google) {
      ;(window as any).google.accounts.id.prompt()
    }
  }

  async function handleFacebook() {
    setSocialLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/oauth-state`, { method: 'POST' })
      const { state } = await res.json()
      const redirectUri = encodeURIComponent(`${API_BASE}/api/auth/facebook/callback`)
      window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=email,public_profile&response_type=code&state=${encodeURIComponent(state)}`
    } catch {
      setError(t('login.errorConnection'))
      setSocialLoading(false)
    }
  }

  async function handlePasskeyLogin() {
    if (!passkeyEmail) return
    setPasskeyLoading(true)
    setError('')
    try {
      const result = await loginWithPasskey(passkeyEmail)
      localStorage.setItem('token', result.token)
      if (result.refreshToken) localStorage.setItem('refreshToken', result.refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginPasskey.error'))
      setPasskeyLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || t('login.errorGeneric'))
      if (data.requires2FA) {
        setNeeds2FA(true)
        setTempToken(data.tempToken)
        setLoading(false)
        return
      }
      localStorage.setItem('token', data.token)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login.errorGeneric')
      if (msg.includes('google') || msg.includes('Google')) {
        setError(t('login.errorGoogleHint'))
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (totpCode.length === 6 && needs2FA && !loading) verify2FA()
  }, [totpCode])

  async function verify2FA() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: totpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('login.errorInvalidCode'))
      localStorage.setItem('token', data.token)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (socialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  const socialBtnClass = "flex-1 flex items-center justify-center gap-2.5 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('login.title')}</h1>

          {needs2FA ? (
            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{t('login.twoFA.title')}</p>
              <p className="text-xs text-gray-500 mb-6">{t('login.twoFA.subtitle')}</p>
              <input type="text" inputMode="numeric" maxLength={6} value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="------" autoFocus />
              {loading && (
                <div className="mt-4">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                </div>
              )}
              {error && (
                <div className="mt-4 w-full bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                  <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Hidden Google-rendered button — opens the account chooser popup
              when clicked. Our custom button below delegates to it via DOM. */}
          <div id="google-signin-hidden" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true" />

          {/* Social buttons */}
          <div className="flex gap-3 mb-3">
            <button onClick={triggerGoogle} className={socialBtnClass}>
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>

            <button onClick={() => alert(t('login.apple'))} className={socialBtnClass}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Apple
            </button>

            <button onClick={handleFacebook} className={socialBtnClass}>
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>

          {/* Passkey login */}
          {isPasskeySupported() && (
            <div className="mb-6">
              {!showPasskeyEmail ? (
                <button
                  onClick={() => setShowPasskeyEmail(true)}
                  className="w-full flex items-center justify-center gap-2.5 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Fingerprint className="w-4 h-4 text-indigo-600" />
                  {t('loginPasskey.button')}
                </button>
              ) : (
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <label className="text-xs font-medium text-gray-700">{t('loginPasskey.emailPrompt')}</label>
                  <input
                    type="email"
                    value={passkeyEmail}
                    onChange={e => setPasskeyEmail(e.target.value)}
                    placeholder={t('loginPasskey.emailPlaceholder')}
                    autoFocus
                    autoComplete="email webauthn"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowPasskeyEmail(false); setPasskeyEmail('') }}
                      className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-white"
                    >
                      {t('loginPasskey.cancel')}
                    </button>
                    <button
                      onClick={handlePasskeyLogin}
                      disabled={passkeyLoading || !passkeyEmail}
                      className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Fingerprint className="w-4 h-4" /> {t('loginPasskey.continue')}</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">{t('login.or')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1.5 block">{t('login.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoComplete="email" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-900">{t('login.password')}</label>
                <Link href="/auth/reset-password" className="text-sm text-indigo-600 hover:underline">{t('login.forgotPassword')}</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('login.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('login.noAccount')} <Link href="/register" className="text-indigo-600 font-semibold hover:underline">{t('login.createAccount')}</Link>
          </p>
          </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t('login.terms')} <Link href="/terms" className="text-indigo-600 hover:underline">{t('login.termsLink')}</Link>, <Link href="/privacy" className="text-indigo-600 hover:underline">{t('login.privacyLink')}</Link> y <Link href="/cancellation" className="text-indigo-600 hover:underline">{t('login.cancellationLink')}</Link>.
        </p>
      </div>
    </div>
  )
}
