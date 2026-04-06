import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cancelación',
  description: 'Política de cancelación de suscripciones de Runbits.',
}

function LegalNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits text-2xl text-brand-700">
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
          <p className="text-sm text-gray-500 mb-8">Última actualización: 1 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            En Runbits queremos que tu experiencia sea positiva. Si decidís cancelar tu suscripción o cuenta,
            este documento explica el proceso y qué esperar.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Cancelación de Suscripción (Comercios)</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1.1 Cómo cancelar</h3>
          <p className="text-gray-700 leading-relaxed">Podés cancelar tu suscripción de las siguientes formas:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Desde el Panel de Comercio:</strong> Ingresá a Configuración → Suscripción → Cancelar suscripción.</li>
            <li><strong>Por email:</strong> Enviá un email a <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a> con el asunto &quot;Cancelación de Suscripción&quot; desde el email asociado a tu cuenta.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1.2 Qué sucede al cancelar</h3>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Acceso hasta fin del período:</strong> Tu suscripción permanece activa hasta el final del período de facturación actual. No se realizarán cobros adicionales.</li>
            <li><strong>Pedidos pendientes:</strong> Todos los pedidos en curso se completarán normalmente. No se aceptarán nuevos pedidos después de la fecha de cancelación efectiva.</li>
            <li><strong>Datos del comercio:</strong> Tu perfil de comercio se desactivará de la app de clientes. Los datos se conservan por 90 días por si decidís reactivar tu cuenta.</li>
            <li><strong>Comisiones pendientes:</strong> Cualquier comisión pendiente de cobro se procesará normalmente.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1.3 Reactivación</h3>
          <p className="text-gray-700 leading-relaxed">
            Si cancelaste tu suscripción y querés volver, podés reactivar tu cuenta dentro de los 90 días
            posteriores a la cancelación sin perder tus datos (menú, configuración, historial). Después de
            90 días, deberás crear una nueva cuenta.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Cancelación de Cuenta (Todos los Usuarios)</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">2.1 Cómo eliminar tu cuenta</h3>
          <p className="text-gray-700 leading-relaxed">
            Para eliminar tu cuenta completamente, enviá un email a{' '}
            <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a>{' '}
            con el asunto &quot;Eliminación de Cuenta&quot;. Procesaremos tu solicitud dentro de los 5 días hábiles.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">2.2 Qué datos se eliminan</h3>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Se eliminan:</strong> Datos de perfil, preferencias, direcciones guardadas, historial de búsqueda.</li>
            <li><strong>Se conservan (por obligación legal):</strong> Registros de transacciones y facturación por 5 años según requisitos fiscales argentinos.</li>
            <li><strong>Se anonimizan:</strong> Datos de uso y estadísticas se anonimizan y pueden conservarse para análisis agregado.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Cancelación de Pedidos (Clientes)</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Antes de la confirmación del comercio:</strong> Cancelación gratuita con reembolso completo.</li>
            <li><strong>Después de la confirmación, antes de la preparación:</strong> Cancelación con reembolso completo menos una tarifa administrativa mínima.</li>
            <li><strong>Durante la preparación o entrega:</strong> No se permite la cancelación. Podés contactar a soporte para resolver situaciones excepcionales.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Período de Gracia</h2>
          <p className="text-gray-700 leading-relaxed">
            Todos los comercios nuevos cuentan con un período de gracia de 7 días desde la activación de su
            suscripción. Durante este período, podés cancelar y recibir un reembolso completo sin preguntas,
            siempre que no se hayan procesado pedidos.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Reembolsos por Cancelación</h2>
          <p className="text-gray-700 leading-relaxed">
            Para información detallada sobre reembolsos asociados a cancelaciones, consultá nuestra{' '}
            <Link href="/refund" className="text-brand-600 hover:underline">Política de Reembolsos</Link>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Contacto</h2>
          <p className="text-gray-700 leading-relaxed">
            Si tenés preguntas sobre la cancelación o necesitás ayuda con el proceso:
          </p>
          <ul className="text-gray-700 space-y-1 list-none pl-0">
            <li><strong>Email:</strong> <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a></li>
            <li><strong>Asunto:</strong> Cancelación de Suscripción / Eliminación de Cuenta</li>
            <li><strong>Horario de atención:</strong> Lunes a viernes, 9:00 a 18:00 (hora Argentina, GMT-3)</li>
          </ul>
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
