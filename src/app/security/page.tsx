"use client"

import Link from 'next/link'
import {
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Lock,
  Database,
  Eye,
  Activity,
  RefreshCw,
  Globe,
  AlertTriangle,
  ShieldAlert,
  Server,
  CheckCircle2,
  Mail,
} from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'
import { useI18n } from '@/i18n'

export default function SecurityPage() {
  const { t } = useI18n()

  const features = [
    { Icon: ShieldCheck, key: '2fa' },
    { Icon: Fingerprint, key: 'passkeys' },
    { Icon: Lock, key: 'aes' },
    { Icon: KeyRound, key: 'pbkdf2' },
    { Icon: AlertTriangle, key: 'hibp' },
    { Icon: Activity, key: 'audit' },
    { Icon: Eye, key: 'sessions' },
    { Icon: RefreshCw, key: 'jwtRotation' },
    { Icon: Globe, key: 'https' },
    { Icon: ShieldAlert, key: 'rateLimit' },
    { Icon: Server, key: 'oauthCsrf' },
    { Icon: Database, key: 'encryptionAtRest' },
  ]

  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-brand-100 text-brand-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            {t('security.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            {t('security.heroTitle')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('security.heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/security/details"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5"
            >
              {t('security.heroCta')}
            </Link>
            <a
              href="mailto:security@runbits.io"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('security.reportVuln')}
            </a>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('security.gridTitle')}
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t('security.gridSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ Icon, key }) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t(`security.features.${key}.title`)}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t(`security.features.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('security.complianceTitle')}
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t('security.complianceSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                  {t('security.complianceCompliant')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {t('security.compliance.gdpr.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('security.compliance.gdpr.desc')}
              </p>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                  {t('security.complianceInProgress')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {t('security.compliance.soc2.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('security.compliance.soc2.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report vulnerability */}
      <section className="py-20 bg-gradient-to-br from-brand-50 via-white to-indigo-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldAlert className="w-12 h-12 text-brand-600 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('security.reportTitle')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('security.reportDesc')}
          </p>
          <a
            href="mailto:security@runbits.io"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5"
          >
            <Mail className="w-4 h-4 mr-2" />
            security@runbits.io
          </a>
          <p className="mt-6 text-sm text-gray-500">
            {t('security.reportFootnote')}
          </p>
        </div>
      </section>

      {/* Footer link */}
      <footer className="border-t border-gray-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t('security.footerCopy')}</p>
          <Link
            href="/security/details"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('security.footerDetails')} →
          </Link>
        </div>
      </footer>
    </main>
  )
}
