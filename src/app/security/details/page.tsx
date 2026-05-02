"use client"

import Link from 'next/link'
import { LandingNavbar } from '@/components/LandingNavbar'
import { useI18n } from '@/i18n'

export default function SecurityDetailsPage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/security" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            ← {t('security.details.back')}
          </Link>

          <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            {t('security.details.title')}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            {t('security.details.subtitle')}
          </p>

          <div className="prose prose-gray max-w-none mt-12 space-y-8">
            <Section title={t('security.details.authTitle')}>
              <p>{t('security.details.authDesc')}</p>
              <ul>
                <li>{t('security.details.auth.password')}</li>
                <li>{t('security.details.auth.totp')}</li>
                <li>{t('security.details.auth.passkeys')}</li>
                <li>{t('security.details.auth.oauth')}</li>
              </ul>
            </Section>

            <Section title={t('security.details.cryptoTitle')}>
              <p>{t('security.details.cryptoDesc')}</p>
            </Section>

            <Section title={t('security.details.sessionsTitle')}>
              <p>{t('security.details.sessionsDesc')}</p>
            </Section>

            <Section title={t('security.details.auditTitle')}>
              <p>{t('security.details.auditDesc')}</p>
            </Section>

            <Section title={t('security.details.responseTitle')}>
              <p>{t('security.details.responseDesc')}</p>
            </Section>
          </div>

          <div className="mt-16 border-t border-gray-200 pt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('security.details.contactTitle')}
            </h2>
            <p className="text-gray-600">
              {t('security.details.contactDesc')}{' '}
              <a href="mailto:security@runbits.io" className="text-brand-600 font-semibold hover:underline">
                security@runbits.io
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
