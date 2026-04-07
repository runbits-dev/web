import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Runbits. Cómo recopilamos, usamos y protegemos tu información.',
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

export default function PrivacyPage() {
  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 1 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            En Runbits LLC (&quot;Runbits&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;), nos comprometemos a proteger tu privacidad.
            Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos la información
            personal de los usuarios de nuestra plataforma, incluyendo el sitio web runbits.io, las aplicaciones
            móviles y todos los servicios relacionados.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Información que Recopilamos</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1.1 Información proporcionada por el usuario</h3>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Datos de registro:</strong> Nombre, dirección de email, número de teléfono, contraseña.</li>
            <li><strong>Datos de comercio:</strong> Nombre del negocio, dirección, CUIT/CUIL, categoría, menú y precios.</li>
            <li><strong>Datos de pago:</strong> Información de tarjeta de crédito/débito procesada de forma segura a través de Stripe. Runbits no almacena números de tarjeta completos.</li>
            <li><strong>Datos de perfil:</strong> Foto de perfil, preferencias de notificación, direcciones de entrega.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1.2 Información recopilada automáticamente</h3>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Datos de uso:</strong> Páginas visitadas, funcionalidades utilizadas, frecuencia de uso.</li>
            <li><strong>Datos del dispositivo:</strong> Tipo de dispositivo, sistema operativo, identificadores únicos.</li>
            <li><strong>Datos de ubicación:</strong> Ubicación geográfica (con tu consentimiento) para facilitar entregas y mostrar comercios cercanos.</li>
            <li><strong>Cookies y tecnologías similares:</strong> Para mejorar la experiencia del usuario y analizar el uso del servicio.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Cómo Usamos tu Información</h2>
          <p className="text-gray-700 leading-relaxed">Utilizamos la información recopilada para:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Proporcionar, mantener y mejorar el Servicio.</li>
            <li>Procesar pedidos y pagos.</li>
            <li>Facilitar la comunicación entre comercios, clientes y repartidores.</li>
            <li>Enviar notificaciones sobre pedidos, actualizaciones del servicio y comunicaciones de marketing (con tu consentimiento).</li>
            <li>Analizar el uso del Servicio para mejorar la experiencia del usuario.</li>
            <li>Prevenir fraudes y garantizar la seguridad de la plataforma.</li>
            <li>Cumplir con obligaciones legales y regulatorias.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Compartición de Información con Terceros</h2>
          <p className="text-gray-700 leading-relaxed">Compartimos información personal con:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Stripe:</strong> Nuestro procesador de pagos, para procesar transacciones de forma segura. Stripe opera bajo su propia política de privacidad disponible en <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">stripe.com/privacy</a>.</li>
            <li><strong>Comercios:</strong> Compartimos datos necesarios del pedido (nombre, dirección de entrega) para cumplir con las órdenes.</li>
            <li><strong>Repartidores:</strong> Compartimos la dirección de entrega y datos de contacto necesarios para completar la entrega.</li>
            <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar el Servicio (hosting, analytics, soporte), bajo acuerdos de confidencialidad.</li>
            <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley, orden judicial o proceso legal.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            <strong>No vendemos tu información personal a terceros.</strong>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Retención de Datos</h2>
          <p className="text-gray-700 leading-relaxed">
            Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para
            proporcionarte el Servicio. Después de la cancelación de tu cuenta:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Los datos de la cuenta se eliminan dentro de los 90 días.</li>
            <li>Los registros de transacciones se conservan por 5 años según requisitos legales y fiscales.</li>
            <li>Los datos anonimizados pueden conservarse indefinidamente para análisis estadístico.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Seguridad de los Datos</h2>
          <p className="text-gray-700 leading-relaxed">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Encriptación de datos en tránsito (TLS/SSL) y en reposo.</li>
            <li>Acceso restringido a datos personales solo al personal autorizado.</li>
            <li>Monitoreo continuo de seguridad y auditorías periódicas.</li>
            <li>Procesamiento de pagos compatible con PCI DSS a través de Stripe.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Tus Derechos</h2>
          <p className="text-gray-700 leading-relaxed">Tenés derecho a:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Acceso:</strong> Solicitar una copia de tu información personal.</li>
            <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta.</li>
            <li><strong>Eliminación:</strong> Solicitar la eliminación de tu información personal.</li>
            <li><strong>Portabilidad:</strong> Recibir tu información en un formato estructurado y legible.</li>
            <li><strong>Oposición:</strong> Oponerte al procesamiento de tu información para fines de marketing.</li>
            <li><strong>Revocación del consentimiento:</strong> Retirar tu consentimiento en cualquier momento.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Para ejercer estos derechos, contactanos a{' '}
            <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a>.
            Responderemos a tu solicitud dentro de los 30 días hábiles.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Cookies</h2>
          <p className="text-gray-700 leading-relaxed">
            Utilizamos cookies y tecnologías similares para:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento del Servicio (autenticación, seguridad).</li>
            <li><strong>Cookies de rendimiento:</strong> Para analizar cómo se utiliza el Servicio y mejorar su rendimiento.</li>
            <li><strong>Cookies de funcionalidad:</strong> Para recordar tus preferencias y personalizar tu experiencia.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del Servicio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Menores de Edad</h2>
          <p className="text-gray-700 leading-relaxed">
            El Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información
            personal de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos
            de inmediato.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Cambios a esta Política</h2>
          <p className="text-gray-700 leading-relaxed">
            Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios
            significativos por email o mediante un aviso destacado en el Servicio. La fecha de &quot;Última
            actualización&quot; al inicio de esta página indica cuándo se realizó la última revisión.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Contacto para Consultas de Privacidad</h2>
          <p className="text-gray-700 leading-relaxed">
            Si tenés preguntas o inquietudes sobre esta Política de Privacidad o el tratamiento de tus datos, contactanos:
          </p>
          <ul className="text-gray-700 space-y-1 list-none pl-0">
            <li><strong>Email:</strong> <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a></li>
            <li><strong>Asunto:</strong> Consulta de Privacidad</li>
            <li><strong>Web:</strong> <a href="https://runbits.io" className="text-brand-600 hover:underline">runbits.io</a></li>
          </ul>
        </article>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Reembolsos</Link>
            <Link href="/cancellation" className="hover:text-white transition-colors">Cancelación</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
