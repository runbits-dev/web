'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n'

export default function AboutPage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">Runbits</Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">{t('about.login')}</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('about.title')}</h1>

        <div className="prose prose-lg text-gray-600 space-y-6">
          <p className="text-xl leading-relaxed">
            {t('about.desc')}
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">{t('about.whyTitle')}</h2>
          <p>
            {t('about.whyP1')}
          </p>
          <p>
            {t('about.whyP2')}
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">{t('about.howTitle')}</h2>
          <p>
            {t('about.howDesc')}
          </p>

          <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 my-8">
            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">01.</span>
                <span><strong>{t('about.step1.title')}</strong> {t('about.step1.desc')}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">02.</span>
                <span><strong>{t('about.step2.title')}</strong> {t('about.step2.desc')}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">03.</span>
                <span><strong>{t('about.step3.title')}</strong> {t('about.step3.desc')}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">04.</span>
                <span><strong>{t('about.step4.title')}</strong> {t('about.step4.desc')}</span>
              </li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">{t('about.valuesTitle')}</h2>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 my-8">
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2"><span className="font-bold text-brand-600">&rarr;</span> <span><strong>{t('about.value1.title')}</strong> {t('about.value1.desc')}</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">&rarr;</span> <span><strong>{t('about.value2.title')}</strong> {t('about.value2.desc')}</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">&rarr;</span> <span><strong>{t('about.value3.title')}</strong> {t('about.value3.desc')}</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">&rarr;</span> <span><strong>{t('about.value4.title')}</strong> {t('about.value4.desc')}</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">&rarr;</span> <span><strong>{t('about.value5.title')}</strong> {t('about.value5.desc')}</span></li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">{t('about.companyTitle')}</h2>
          <p>
            {t('about.companyP1')}
          </p>
          <p>
            {t('about.companyP2')}
          </p>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            {t('about.cta')}
          </Link>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            {t('about.backToHome')}
          </Link>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Runbits.io LLC. {t('about.footerRights')}</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-gray-600">{t('about.footerPrivacy')}</Link>
            <Link href="/terms" className="hover:text-gray-600">{t('about.footerTerms')}</Link>
            <Link href="https://status.runbits.dev" className="hover:text-gray-600">{t('about.footerStatus')}</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
