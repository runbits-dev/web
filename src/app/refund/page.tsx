'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n'

function LegalNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits logo-runbits-dark text-2xl">
            runbits
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
            {t('legal.backToHome')}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default function RefundPage() {
  const { t } = useI18n()

  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('legal.refundTitle')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('legal.lastUpdated')}: 19 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            Esta política cubre exclusivamente los reembolsos de suscripciones y módulos contratados directamente con Runbits.
            Runbits es una plataforma SaaS — no procesamos pagos entre comercios y sus clientes, y no somos responsables
            de las transacciones que ocurren dentro de cada comercio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Reembolsos de Suscripciones</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Primeros 14 días:</strong> Reembolso completo si cancelás dentro de los primeros 14 días desde la activación del plan.</li>
            <li><strong>Después de 14 días:</strong> Reembolso prorrateado por los días restantes del período de facturación.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Reembolsos de Módulos Add-on</h2>
          <p className="text-gray-700 leading-relaxed">
            Los módulos adicionales siguen la misma política que las suscripciones: reembolso completo dentro de los 14 días
            de activación, prorrateado a partir de entonces.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Cómo Solicitar un Reembolso</h2>
          <p className="text-gray-700 leading-relaxed">Tenés dos opciones:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Por email:</strong> Escribí a <a href="mailto:soporte@runbits.io" className="text-brand-600 hover:underline">soporte@runbits.io</a> con el asunto &quot;Solicitud de Reembolso&quot; e indicá el email de tu cuenta.</li>
            <li><strong>Desde el dashboard:</strong> Ingresá a Configuración → Suscripción → Cancelar y seguí los pasos. El reembolso aplicable se procesa automáticamente.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Plazo de Procesamiento</h2>
          <p className="text-gray-700 leading-relaxed">
            Los reembolsos se acreditan en el método de pago original dentro de los <strong>5 a 10 días hábiles</strong>
            contados desde la aprobación de la solicitud.
          </p>
        </article>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. {t('legal.footerRights')}</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">{t('legal.footerTerms')}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('legal.footerPrivacy')}</Link>
            <Link href="/cancellation" className="hover:text-white transition-colors">{t('legal.footerCancellation')}</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
