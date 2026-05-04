"use client"

import { useState } from 'react'
import { useI18n } from '@/i18n'
import { X, Loader2, Check, ArrowRight, ExternalLink } from 'lucide-react'
import { CopyRow } from './NSMigrationWizard'

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

type CnameResult = {
  domainId: string
  hostname: string
  cname: { name: string; value: string }
}

type Props = {
  initialDomain?: string
  onClose: () => void
  onConnect: (hostname: string) => Promise<CnameResult>
  onVerify: (domainId: string) => Promise<{ active: boolean }>
}

export function CustomHostnameWizard({
  initialDomain = '',
  onClose,
  onConnect,
  onVerify,
}: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [hostname, setHostname] = useState(initialDomain)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CnameResult | null>(null)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)

  function validateDomain(value: string): string | null {
    if (!DOMAIN_REGEX.test(value)) return t('settingsDomain.customDomain.errorFormat')
    return null
  }

  async function handleStep1Continue() {
    const v = validateDomain(hostname.trim().toLowerCase())
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await onConnect(hostname.trim().toLowerCase())
      setResult(res)
      setStep(2)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || t('settingsDomain.customDomain.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify() {
    if (!result) return
    setSubmitting(true)
    setVerifyMessage(null)
    try {
      const res = await onVerify(result.domainId)
      if (res.active) {
        setStep(4)
      } else {
        setVerifyMessage(t('settingsDomain.customDomain.wizard.step3Pending'))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setVerifyMessage(msg || t('settingsDomain.customDomain.wizard.step3Pending'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {t('settingsDomain.customHostname.wizard.title')}
        </h3>
        <StepIndicator current={step} total={4} />

        {step === 1 && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-1">
              {t('settingsDomain.customHostname.wizard.step1Title')}
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              {t('settingsDomain.customHostname.wizard.step1Desc')}
            </p>
            <input
              type="text"
              value={hostname}
              onChange={(e) => {
                setHostname(e.target.value.toLowerCase().trim())
                if (error) setError(null)
              }}
              placeholder={t('settingsDomain.customHostname.placeholder')}
              className="w-full px-3 py-2.5 rounded-xl ring-1 ring-slate-200 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleStep1Continue}
                disabled={submitting || !hostname}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{' '}
                    {t('settingsDomain.customDomain.connecting')}
                  </>
                ) : (
                  <>
                    {t('settingsDomain.customHostname.wizard.step1Cta')}{' '}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && result && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-1">
              {t('settingsDomain.customHostname.wizard.step2Title')}
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              {t('settingsDomain.customHostname.wizard.step2Desc')}
            </p>
            <div className="space-y-2 mb-4">
              <CopyRow
                value="CNAME"
                label={t('settingsDomain.customHostname.wizard.step2Type')}
              />
              <CopyRow
                value={result.cname.name}
                label={t('settingsDomain.customHostname.wizard.step2Name')}
              />
              <CopyRow
                value={result.cname.value}
                label={t('settingsDomain.customHostname.wizard.step2Value')}
              />
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 inline-flex items-center justify-center gap-2"
            >
              {t('settingsDomain.customHostname.wizard.step2Done')}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && result && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-1">
              {t('settingsDomain.customHostname.wizard.step3Title')}
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              {t('settingsDomain.customHostname.wizard.step3Desc')}
            </p>
            {verifyMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <p className="text-xs text-amber-800">{verifyMessage}</p>
              </div>
            )}
            <button
              onClick={handleVerify}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{' '}
                  {t('settingsDomain.verifying')}
                </>
              ) : (
                t('settingsDomain.customHostname.wizard.step3Cta')
              )}
            </button>
          </div>
        )}

        {step === 4 && result && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="w-4 h-4" />
              </span>
              {t('settingsDomain.customHostname.wizard.step4Title')}
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              {t('settingsDomain.customHostname.wizard.step4Desc')}{' '}
              <a
                href={`https://${result.hostname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                https://{result.hostname} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700"
            >
              {t('settingsDomain.customHostname.wizard.step4Cta')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i + 1 <= current ? 'bg-blue-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}
