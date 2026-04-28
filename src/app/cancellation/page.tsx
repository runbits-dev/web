import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cancelación',
  description: 'Política de cancelación de cuentas y suscripciones de Runbits.',
}

function LegalNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits logo-runbits-dark text-2xl">
            runbits
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
            &larr; Volver al inicio
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default function CancellationPage() {
  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de Cancelación</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 19 de abril de 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Eliminar tu cuenta</h2>
          <p className="text-gray-700 leading-relaxed">
            Para cancelar y eliminar tu cuenta, ingresá a <strong>Configuración → Eliminar cuenta</strong> en el dashboard.
            La eliminación es inmediata y permanente.
          </p>
          <p className="text-gray-700 leading-relaxed">Al eliminar tu cuenta:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Toda suscripción activa se cancela de inmediato.</li>
            <li>Se eliminan todos tus datos personales: perfil, email, teléfono y configuración de cuenta.</li>
            <li>Se eliminan todos los perfiles de negocio y sus datos asociados: catálogo, pedidos e historial.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Qué conservamos</h2>
          <p className="text-gray-700 leading-relaxed">
            Retenemos únicamente <strong>datos estadísticos anonimizados</strong> para análisis de la plataforma.
            No se conserva ningún dato personal ni contenido protegido por derechos de autor.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Solo cancelar el plan (sin eliminar la cuenta)</h2>
          <p className="text-gray-700 leading-relaxed">
            Si querés cancelar tu suscripción pero mantener la cuenta activa, ingresá a{' '}
            <strong>Configuración → Suscripción → Cancelar plan</strong>.
            Tu cuenta queda en plan gratuito y tus datos se conservan.
            Para información sobre reembolsos, consultá nuestra{' '}
            <Link href="/refund" className="text-brand-600 hover:underline">Política de Reembolsos</Link>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Contacto</h2>
          <p className="text-gray-700 leading-relaxed">
            Si necesitás ayuda con el proceso de cancelación, escribinos a{' '}
            <a href="mailto:soporte@runbits.io" className="text-brand-600 hover:underline">soporte@runbits.io</a>.
          </p>
        </article>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Reembolsos</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
