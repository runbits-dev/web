"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

type Phase = 'checking' | 'success' | 'failed' | 'timeout'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30000

export default function FeaturedResultClient() {
  const params = useParams<{ id: string }>()
  const id = params?.id ? decodeURIComponent(params.id) : ''
  const router = useRouter()
  const { t } = useI18n()

  const [phase, setPhase] = useState<Phase>('checking')
  const [retryUrl, setRetryUrl] = useState<string | null>(null)
  const startedAt = useRef<number>(Date.now())

  useEffect(() => {
    if (!id || id === 'placeholder') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      if (cancelled) return
      try {
        const slot = await api.getFeatured(id)
        if (cancelled) return
        if (slot.status === 'active') {
          setPhase('success')
          // Auto-redirect after 1.5s.
          setTimeout(() => { if (!cancelled) router.replace(`/dashboard/marketing/featured/${id}`) }, 1500)
          return
        }
        if (slot.status === 'cancelled' || slot.status === 'expired') {
          setPhase('failed')
          setRetryUrl(slot.checkout_url ?? null)
          return
        }
        // Still pending_payment → keep polling unless timed out.
        if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
          setPhase('timeout')
          setRetryUrl(slot.checkout_url ?? null)
          return
        }
        timer = setTimeout(tick, POLL_INTERVAL_MS)
      } catch {
        if (cancelled) return
        if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
          setPhase('timeout')
          return
        }
        timer = setTimeout(tick, POLL_INTERVAL_MS)
      }
    }
    tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [id, router])

  if (id === 'placeholder' || !id) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        {phase === 'checking' && (
          <>
            <Loader2 className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t('marketing.featured.result.checking')}</h1>
            <p className="text-sm text-slate-500">{t('marketing.featured.result.checkingHint')}</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t('marketing.featured.result.successTitle')}</h1>
            <p className="text-sm text-slate-500 mb-6">{t('marketing.featured.result.successBody')}</p>
            <Link
              href={`/dashboard/marketing/featured/${id}`}
              className="inline-block bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700"
            >
              {t('marketing.featured.result.successCta')}
            </Link>
          </>
        )}

        {phase === 'failed' && (
          <>
            <XCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t('marketing.featured.result.failTitle')}</h1>
            <p className="text-sm text-slate-500 mb-6">{t('marketing.featured.result.failBody')}</p>
            <div className="flex flex-col gap-2 items-stretch">
              {retryUrl ? (
                <a
                  href={retryUrl}
                  className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700"
                >
                  {t('marketing.featured.result.failCta')}
                </a>
              ) : (
                <Link
                  href="/dashboard/marketing/featured/new"
                  className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700"
                >
                  {t('marketing.featured.result.failCta')}
                </Link>
              )}
              <Link
                href="/dashboard/marketing/featured"
                className="text-sm text-slate-500 hover:text-slate-900 px-5 py-2"
              >
                {t('marketing.featured.detail.back')}
              </Link>
            </div>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <Clock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t('marketing.featured.result.timeoutTitle')}</h1>
            <p className="text-sm text-slate-500 mb-6">{t('marketing.featured.result.timeoutBody')}</p>
            <Link
              href={`/dashboard/marketing/featured/${id}`}
              className="inline-block bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700"
            >
              {t('marketing.featured.actions.view')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
