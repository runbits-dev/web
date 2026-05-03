"use client"

import Link from 'next/link'
import {
  UtensilsCrossed,
  MapPin,
  MessageCircle,
  PiggyBank,
  ChefHat,
  Truck,
  ClipboardList,
} from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'
import { FooterLocaleBar } from '@/components/FooterLocaleBar'
import { PricingSection } from '@/components/PricingSection'
import { useI18n } from '@/i18n'

const VERTICAL = 'food' as const
const RECOMMENDED_TIER = 'starter' as const

const FEATURES = [
  { key: 'feat1', Icon: UtensilsCrossed },
  { key: 'feat2', Icon: MapPin },
  { key: 'feat3', Icon: MessageCircle },
  { key: 'feat4', Icon: PiggyBank },
]

const STEPS = [
  { number: '01', key: 'step1', Icon: ChefHat },
  { number: '02', key: 'step2', Icon: Truck },
  { number: '03', key: 'step3', Icon: ClipboardList },
]

function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
          {t(`verticals.${VERTICAL}.title`)}{' '}
          <span className="text-brand-600">{t(`verticals.${VERTICAL}.title2`)}</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {t(`verticals.${VERTICAL}.subtitle`)}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/register?plan=${RECOMMENDED_TIER}&interval=monthly&vertical=${VERTICAL}`}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          >
            {t('verticals.common.ctaPrimary')}
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
          >
            {t('nav.pricing')}
          </a>
        </div>
      </div>
    </section>
  )
}

function VerticalFeatures() {
  const { t } = useI18n()

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('verticals.common.featuresTitle')}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="group relative bg-gray-50 rounded-2xl p-6 hover:bg-brand-50 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                <f.Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(`verticals.${VERTICAL}.${f.key}.title`)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(`verticals.${VERTICAL}.${f.key}.desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* Mocked dashboard preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-gray-500 font-medium">
                {t('verticals.common.mockupBadge')}
              </span>
            </div>
            <div className="p-6 sm:p-10">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-brand-600 font-semibold">
                    {t(`verticals.${VERTICAL}.mockup.title`)}
                  </p>
                  <p className="mt-1 text-base text-gray-700 font-medium">
                    {t(`verticals.${VERTICAL}.mockup.subtitle`)}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  Live
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-white border border-gray-100"
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useI18n()

  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('verticals.common.howItWorks')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-brand-200" />
              )}
              <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-bold text-brand-100">
                    {step.number}
                  </span>
                  <step.Icon className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {t(`verticals.${VERTICAL}.${step.key}.title`)}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {t(`verticals.${VERTICAL}.${step.key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t(`verticals.${VERTICAL}.compare.title`)}
          </h3>
          <p className="mt-3 text-base text-gray-600">
            {t(`verticals.${VERTICAL}.compare.desc`)}
          </p>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  const { t } = useI18n()
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <span className="logo-runbits logo-runbits-light text-2xl">RunBits</span>
            <p className="mt-3 text-sm leading-relaxed">{t('footer.desc')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">{t('nav.features')}</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('nav.howItWorks')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">{t('footer.termsAndConditions')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">{t('footer.refundPolicy')}</Link></li>
              <li><Link href="/cancellation" className="hover:text-white transition-colors">{t('footer.cancellationPolicy')}</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">{t('footer.security')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.contactTitle')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:soporte@runbits.io" className="hover:text-white transition-colors">soporte@runbits.io</a></li>
              <li><a href="https://runbits.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">runbits.app</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. {t('footer.rights')}</p>
          <div className="flex items-center gap-4">
            <FooterLocaleBar />
            <p className="text-xs text-gray-500">Runbits LLC &mdash; Argentina</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function FoodLanding() {
  return (
    <main>
      <LandingNavbar />
      <Hero />
      <VerticalFeatures />
      <HowItWorks />
      <PricingSection recommendedTier={RECOMMENDED_TIER} />
      <LandingFooter />
    </main>
  )
}
