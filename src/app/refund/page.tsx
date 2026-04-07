import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Reembolsos',
  description: 'Política de reembolsos y disputas de Runbits.',
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

export default function RefundPage() {
  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de Reembolsos</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 1 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            En Runbits nos esforzamos por brindar un servicio de calidad. Esta política describe cómo manejamos
            los reembolsos para los diferentes tipos de transacciones en nuestra plataforma.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Naturaleza del Servicio</h2>
          <p className="text-gray-700 leading-relaxed">
            Runbits es una plataforma digital de servicios (SaaS). No vendemos productos físicos directamente.
            Actuamos como intermediario entre comercios, clientes y repartidores. Por lo tanto, las políticas
            de reembolso varían según el tipo de transacción.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Reembolsos de Suscripciones (Comercios)</h2>
          <p className="text-gray-700 leading-relaxed">
            Para comercios con suscripción mensual (Plan Premium):
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Cancelación dentro de los primeros 7 días:</strong> Reembolso completo del monto de la suscripción si no se procesaron pedidos durante ese período.</li>
            <li><strong>Cancelación después de 7 días:</strong> Reembolso proporcional (prorrateado) por los días restantes del período de facturación, descontando cualquier comisión reducida ya aplicada.</li>
            <li><strong>Renovación automática:</strong> Si se cobró una renovación automática no deseada, podés solicitar un reembolso completo dentro de las 48 horas posteriores al cobro.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Disputas de Pedidos (Clientes)</h2>
          <p className="text-gray-700 leading-relaxed">
            Las disputas relacionadas con pedidos se manejan caso por caso. Situaciones que pueden dar lugar a un reembolso:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Pedido no entregado:</strong> Si el pedido no fue entregado y no se puede resolver con una nueva entrega, se emitirá un reembolso completo.</li>
            <li><strong>Productos incorrectos:</strong> Si recibiste productos diferentes a los pedidos, podés solicitar un reembolso parcial o total según la situación.</li>
            <li><strong>Productos en mal estado:</strong> Si los productos llegaron en condiciones inaceptables, se evaluará un reembolso parcial o total.</li>
            <li><strong>Cobro duplicado:</strong> Los cobros duplicados se reembolsan automáticamente al ser detectados, o inmediatamente al ser reportados.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Comisiones (Comercios)</h2>
          <p className="text-gray-700 leading-relaxed">
            Las comisiones cobradas por pedidos completados exitosamente no son reembolsables. Sin embargo:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Si un pedido fue cancelado antes de la preparación, la comisión no se cobra.</li>
            <li>Si un pedido fue reembolsado al cliente por un problema atribuible a la plataforma, la comisión se revierte al comercio.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Cómo Solicitar un Reembolso</h2>
          <p className="text-gray-700 leading-relaxed">Para solicitar un reembolso:</p>
          <ol className="text-gray-700 space-y-2 list-decimal pl-6">
            <li>Enviá un email a <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a> con el asunto &quot;Solicitud de Reembolso&quot;.</li>
            <li>Incluí tu nombre, email de la cuenta, número de pedido o referencia de la transacción.</li>
            <li>Describí el motivo de la solicitud con el mayor detalle posible.</li>
            <li>Si aplica, adjuntá fotos o evidencia que respalden tu solicitud.</li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Plazos de Procesamiento</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Revisión de la solicitud:</strong> Dentro de 3 días hábiles.</li>
            <li><strong>Procesamiento del reembolso:</strong> Una vez aprobado, el reembolso se procesa dentro de 5-10 días hábiles.</li>
            <li><strong>Acreditación:</strong> El tiempo de acreditación depende de tu banco o emisor de tarjeta, generalmente entre 5 y 15 días hábiles adicionales.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Los reembolsos se realizan al mismo método de pago utilizado en la transacción original.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Excepciones</h2>
          <p className="text-gray-700 leading-relaxed">No se otorgarán reembolsos en los siguientes casos:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Pedidos completados y entregados satisfactoriamente.</li>
            <li>Solicitudes realizadas más de 30 días después de la transacción.</li>
            <li>Situaciones causadas por información incorrecta proporcionada por el usuario (dirección errónea, datos de contacto incorrectos).</li>
            <li>Uso fraudulento o abusivo de la política de reembolsos.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Contacto</h2>
          <p className="text-gray-700 leading-relaxed">
            Para cualquier consulta sobre reembolsos:
          </p>
          <ul className="text-gray-700 space-y-1 list-none pl-0">
            <li><strong>Email:</strong> <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a></li>
            <li><strong>Asunto:</strong> Solicitud de Reembolso</li>
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
            <Link href="/cancellation" className="hover:text-white transition-colors">Cancelación</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
