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

export default function PrivacyPage() {
  const { t } = useI18n()

  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('legal.privacyTitle')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('legal.lastUpdated')}: 19 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            En Runbits LLC (&quot;Runbits&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;), nos comprometemos a proteger tu privacidad.
            Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos la información
            personal de los usuarios de nuestra plataforma, incluyendo el sitio web runbits.io, las aplicaciones
            móviles y todos los servicios relacionados.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Cumplimos con las regulaciones de privacidad aplicables, incluyendo el <strong>GDPR</strong> (Reglamento General
            de Protección de Datos, UE), la <strong>CCPA</strong> (Ley de Privacidad del Consumidor de California, EE.UU.)
            y la <strong>LGPD</strong> (Lei Geral de Proteção de Dados, Brasil).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Información que Recopilamos</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Datos de registro:</strong> Nombre, dirección de email, número de teléfono, contraseña.</li>
            <li><strong>Datos del negocio:</strong> Nombre del comercio, categoría, catálogo y configuración de la tienda.</li>
            <li><strong>Datos de pago:</strong> Procesados de forma segura a través de Stripe. Runbits no almacena números de tarjeta completos.</li>
            <li><strong>Datos de uso:</strong> Páginas visitadas, funcionalidades utilizadas, frecuencia de uso.</li>
            <li><strong>Datos de ubicación:</strong> Ubicación geográfica (con tu consentimiento) para facilitar entregas.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Para qué Usamos tu Información</h2>
          <p className="text-gray-700 leading-relaxed">Utilizamos tu información únicamente para:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Proveer y mantener el servicio de Runbits.</li>
            <li>Procesar suscripciones y pagos.</li>
            <li>Enviar notificaciones sobre el servicio (con tu consentimiento para comunicaciones de marketing).</li>
            <li>Mejorar la plataforma mediante análisis de uso.</li>
            <li>Prevenir fraudes y garantizar la seguridad.</li>
            <li>Cumplir con obligaciones legales.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Terceros con quienes Compartimos Datos</h2>
          <p className="text-gray-700 leading-relaxed">
            Compartimos datos personales solo con los terceros estrictamente necesarios para operar el servicio:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Cloudflare:</strong> Infraestructura de hosting y red de entrega de contenido. Los datos se procesan en la red edge global de Cloudflare. Ver <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">política de privacidad de Cloudflare</a>.</li>
            <li><strong>Stripe:</strong> Procesamiento de pagos. Opera bajo su propia política disponible en <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">stripe.com/privacy</a>.</li>
            <li><strong>Resend:</strong> Envío de emails transaccionales (confirmaciones, notificaciones del servicio).</li>
            <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley u orden judicial.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            <strong>No vendemos tu información personal a terceros, nunca.</strong>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Transferencias Internacionales</h2>
          <p className="text-gray-700 leading-relaxed">
            Los datos se procesan en la red edge global de Cloudflare, que puede incluir centros de datos fuera de tu país.
            Al usar Runbits, aceptás este procesamiento conforme a las garantías descritas en las políticas de nuestros
            proveedores de infraestructura.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Retención de Datos</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Datos personales:</strong> Se conservan únicamente mientras la cuenta esté activa. Al eliminar tu cuenta, los datos personales se eliminan de inmediato.</li>
            <li><strong>Datos estadísticos anonimizados:</strong> Se retienen indefinidamente para análisis de la plataforma. No contienen información personal ni contenido protegido por derechos de autor.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Tus Derechos</h2>
          <p className="text-gray-700 leading-relaxed">
            De acuerdo con el GDPR, CCPA, LGPD y otras regulaciones aplicables, tenés derecho a:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Acceso:</strong> Solicitar una copia de tu información personal.</li>
            <li><strong>Corrección:</strong> Corregir información inexacta o incompleta.</li>
            <li><strong>Eliminación:</strong> Solicitar la eliminación de tu información personal (&quot;derecho al olvido&quot;).</li>
            <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y legible.</li>
            <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos para fines de marketing.</li>
            <li><strong>Revocación del consentimiento:</strong> Retirar tu consentimiento en cualquier momento.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <a href="mailto:soporte@runbits.io" className="text-brand-600 hover:underline">soporte@runbits.io</a>.
            Responderemos dentro de los 30 días hábiles.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Seguridad</h2>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Encriptación en tránsito (TLS/SSL) y en reposo.</li>
            <li>Acceso a datos personales restringido al personal autorizado.</li>
            <li>Procesamiento de pagos compatible con PCI DSS a través de Stripe.</li>
            <li>Monitoreo continuo de seguridad.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Cookies</h2>
          <p className="text-gray-700 leading-relaxed">
            Usamos cookies esenciales para autenticación y seguridad, y cookies de rendimiento para analizar el uso del servicio.
            Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del servicio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Menores de Edad</h2>
          <p className="text-gray-700 leading-relaxed">
            El servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal de menores.
            Si detectamos que se recopiló información de un menor, la eliminaremos de inmediato.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Cambios a esta Política</h2>
          <p className="text-gray-700 leading-relaxed">
            Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por email
            o mediante un aviso en el servicio. La fecha de &quot;Última actualización&quot; indica cuándo se realizó la última revisión.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">11. Contacto</h2>
          <ul className="text-gray-700 space-y-1 list-none pl-0">
            <li><strong>Email:</strong> <a href="mailto:soporte@runbits.io" className="text-brand-600 hover:underline">soporte@runbits.io</a></li>
            <li><strong>Asunto:</strong> Consulta de Privacidad</li>
            <li><strong>Web:</strong> <a href="https://runbits.io" className="text-brand-600 hover:underline">runbits.io</a></li>
          </ul>
        </article>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. {t('legal.footerRights')}</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">{t('legal.footerTerms')}</Link>
            <Link href="/refund" className="hover:text-white transition-colors">{t('legal.footerRefund')}</Link>
            <Link href="/cancellation" className="hover:text-white transition-colors">{t('legal.footerCancellation')}</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
