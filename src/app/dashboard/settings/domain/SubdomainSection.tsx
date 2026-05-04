"use client"

import { useState } from 'react'
import { useI18n } from '@/i18n'
import { Loader2 } from 'lucide-react'
import { DomainCard } from './DomainCard'
import type { Domain } from './page'

const SLUG_REGEX = /^[a-z0-9-]{3,30}$/

type Props = {
  domain: Domain | null
  onReserve: (slug: string) => Promise<void>
  onVerify: (id: string) => Promise<unknown>
  onDisconnect: (id: string) => Promise<unknown>
}

export function SubdomainSection({
  domain,
  onReserve,
  onVerify,
  onDisconnect,
}: Props) {
  const { t } = useI18n()
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(!domain)

  function validateSlug(value: string): string | null {
    if (!SLUG_REGEX.test(value)) return t('settingsDomain.subdomain.errorFormat')
    if (value.startsWith('-') || value.endsWith('-')) {
      return t('settingsDomain.subdomain.errorHyphenEdge')
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateSlug(slug)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onReserve(slug)
      setSlug('')
      setShowForm(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('use')) {
        setError(t('settingsDomain.subdomain.errorTaken'))
      } else {
        setError(t('settingsDomain.subdomain.errorGeneric'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          {t('settingsDomain.subdomain.title')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('settingsDomain.subdomain.subtitle')}
        </p>
      </header>

      {domain && !showForm ? (
        <div className="space-y-3">
          <DomainCard
            domain={domain}
            onVerify={onVerify}
            onDisconnect={onDisconnect}
          />
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {t('settingsDomain.subdomain.change')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().trim())
                  if (error) setError(null)
                }}
                placeholder={t('settingsDomain.subdomain.placeholder')}
                className="flex-1 px-3 py-2.5 text-sm text-slate-900 outline-none bg-transparent"
                disabled={submitting}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="px-3 py-2.5 text-sm text-slate-500 bg-slate-50 border-l border-slate-200">
                {t('settingsDomain.subdomain.suffix')}
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting || !slug}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{' '}
                  {t('settingsDomain.subdomain.reserving')}
                </>
              ) : (
                t('settingsDomain.subdomain.reserve')
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {domain && (
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError(null)
                setSlug('')
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              {t('common.cancel')}
            </button>
          )}
        </form>
      )}
    </section>
  )
}
