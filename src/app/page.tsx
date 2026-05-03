"use client"

import Link from 'next/link'
import { Users, DollarSign, Store, KeyRound, Smartphone, LayoutDashboard, Truck, BarChart3, Check, BriefcaseBusiness, Bell, MessageSquare, ShieldCheck } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'
import { FooterLocaleBar } from '@/components/FooterLocaleBar'
import { PricingSection } from '@/components/PricingSection'
import { useI18n } from '@/i18n'

function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
          {t('hero.title1')}{' '}
          <span className="text-brand-600">{t('hero.title2')}</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          >
            {t('hero.cta')}
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
          >
            {t('nav.login')}
          </Link>
        </div>

        {/* Value props */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">$0</div>
            <div className="text-sm text-gray-500 mt-1">{t('valueProp.free')}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">0%</div>
            <div className="text-sm text-gray-500 mt-1">{t('valueProp.commission')}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">100%</div>
            <div className="text-sm text-gray-500 mt-1">{t('valueProp.clients')}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyRunbits() {
  const { t } = useI18n()

  const benefits = [
    { key: 'benefit1', Icon: Users },
    { key: 'benefit2', Icon: DollarSign },
    { key: 'benefit3', Icon: Store },
    { key: 'benefit4', Icon: KeyRound },
  ]

  return (
    <section className="py-20 bg-gray-50" id="why-runbits">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t('whyRunbits.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('whyRunbits.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                <b.Icon className="w-5 h-5 text-brand-700" />
              </div>
              <div className="mt-4">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t(`whyRunbits.${b.key}.title`)}</p>
                    <p className="text-sm text-gray-600 mt-1">{t(`whyRunbits.${b.key}.desc`)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base text-gray-700 font-medium max-w-xl mx-auto">
            <span className="text-brand-600 font-bold">{t('whyRunbits.footer')}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const { t } = useI18n()

  const features = [
    { key: 'multiType', Icon: BriefcaseBusiness },
    { key: 'store', Icon: Smartphone },
    { key: 'aiChat', Icon: MessageSquare },
    { key: 'auth', Icon: ShieldCheck },
    { key: 'push', Icon: Bell },
    { key: 'dashboard', Icon: LayoutDashboard },
    { key: 'delivery', Icon: Truck },
    { key: 'analytics', Icon: BarChart3 },
  ]

  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('features.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group relative bg-gray-50 rounded-2xl p-6 hover:bg-brand-50 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                <feature.Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(`features.${feature.key}.title`)}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t(`features.${feature.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useI18n()

  const steps = [
    { number: '01', key: 'step1' },
    { number: '02', key: 'step2' },
    { number: '03', key: 'step3' },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-brand-200" />
              )}
              <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <span className="text-5xl font-bold text-brand-100">{step.number}</span>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{t(`howItWorks.${step.key}.title`)}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{t(`howItWorks.${step.key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


function Modules() {
  const { t } = useI18n()

  const modules = [
    { categoryKey: 'sales', items: ['loyalty', 'giftCards'] },
    { categoryKey: 'logistics', items: ['gps', 'inventory'] },
    { categoryKey: 'communication', items: ['whatsapp', 'emailMarketing'] },
    { categoryKey: 'operations', items: ['afip', 'verification'] },
  ]

  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('modules.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('modules.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map(group => (
            <div key={group.categoryKey}>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">{t(`modules.categories.${group.categoryKey}`)}</h3>
              <div className="space-y-3">
                {group.items.map(itemKey => (
                  <div key={itemKey} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{t(`modules.items.${itemKey}.name`)}</span>
                      <span className="text-xs font-bold text-brand-600">{t(`modules.items.${itemKey}.price`)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{t(`modules.items.${itemKey}.desc`)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          {t('modules.footnote')}
        </p>
      </div>
    </section>
  )
}

function Contact() {
  const { t } = useI18n()

  return (
    <section id="contact" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('contact.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('contact.subtitle')}
          </p>

          <div className="mt-10 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('contact.emailTitle')}</h3>
                <a
                  href="mailto:soporte@runbits.io"
                  className="mt-1 text-brand-600 hover:text-brand-700 font-medium text-lg"
                >
                  soporte@runbits.io
                </a>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                {t('contact.footnote')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('contact.badge1')}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('contact.badge2')}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="logo-runbits logo-runbits-light text-2xl">RunBits</span>
            <p className="mt-3 text-sm leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t('nav.features')}
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  {t('nav.pricing')}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  {t('nav.howItWorks')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {t('footer.termsAndConditions')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  {t('footer.refundPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-white transition-colors">
                  {t('footer.cancellationPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors">
                  {t('footer.security')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.contactTitle')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:soporte@runbits.io" className="hover:text-white transition-colors">
                  soporte@runbits.io
                </a>
              </li>
              <li>
                <a href="https://runbits.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  runbits.app
                </a>
              </li>
            </ul>
            {/* Social placeholder */}
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Runbits LLC. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <FooterLocaleBar />
            <p className="text-xs text-gray-500">
              Runbits LLC &mdash; Argentina
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main>
      <LandingNavbar />
      <Hero />
      <WhyRunbits />
      <Features />
      <HowItWorks />
      <PricingSection />
      <Modules />
      <Contact />
      <Footer />
    </main>
  )
}
