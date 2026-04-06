import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma Runbits.',
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

export default function TermsPage() {
  return (
    <>
      <LegalNav />
      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray prose-headings:text-gray-900 prose-a:text-brand-600 max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 1 de abril de 2026</p>

          <p className="text-gray-700 leading-relaxed">
            Bienvenido a Runbits. Estos Términos y Condiciones (&quot;Términos&quot;) regulan el uso de la plataforma
            Runbits, incluyendo el sitio web runbits.io, la aplicación móvil y todos los servicios relacionados
            (colectivamente, el &quot;Servicio&quot;), operados por Runbits LLC (&quot;Runbits&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;).
          </p>
          <p className="text-gray-700 leading-relaxed">
            Al acceder o utilizar el Servicio, aceptás estar sujeto a estos Términos. Si no estás de acuerdo con
            alguna parte de estos Términos, no podés acceder al Servicio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Descripción del Servicio</h2>
          <p className="text-gray-700 leading-relaxed">
            Runbits es una plataforma de delivery que conecta comercios (restaurantes, tiendas y otros negocios)
            con clientes finales a través de una red de repartidores. El Servicio incluye:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Panel de Comercio:</strong> Herramienta web para que los comercios gestionen su menú, pedidos, estadísticas y configuración de su negocio en la plataforma.</li>
            <li><strong>Aplicación para Clientes:</strong> Aplicación móvil donde los clientes pueden explorar comercios, realizar pedidos y hacer seguimiento de entregas.</li>
            <li><strong>Aplicación para Repartidores:</strong> Aplicación móvil para que los repartidores acepten y gestionen entregas.</li>
            <li><strong>Panel de Administración:</strong> Herramientas internas para la gestión de la plataforma.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Registro y Cuentas</h2>
          <p className="text-gray-700 leading-relaxed">
            Para utilizar ciertas funcionalidades del Servicio, debés crear una cuenta proporcionando información
            precisa y completa. Sos responsable de mantener la confidencialidad de tu cuenta y contraseña, y de
            todas las actividades que ocurran bajo tu cuenta.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Debés notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta. Runbits no será
            responsable por pérdidas derivadas del uso no autorizado de tu cuenta.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Obligaciones del Usuario</h2>
          <p className="text-gray-700 leading-relaxed">Al utilizar el Servicio, te comprometés a:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Proporcionar información veraz y actualizada.</li>
            <li>No utilizar el Servicio para fines ilegales o no autorizados.</li>
            <li>No interferir con el funcionamiento del Servicio ni intentar acceder a sistemas no autorizados.</li>
            <li>Cumplir con todas las leyes y regulaciones aplicables, incluyendo las de seguridad alimentaria y comercio electrónico.</li>
            <li>No reproducir, duplicar, copiar, vender o explotar cualquier parte del Servicio sin autorización expresa.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">3.1 Obligaciones específicas de Comercios</h3>
          <p className="text-gray-700 leading-relaxed">Los comercios registrados en la plataforma se comprometen a:</p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Mantener actualizada la información de su menú, precios y disponibilidad.</li>
            <li>Cumplir con los tiempos de preparación estimados.</li>
            <li>Garantizar la calidad e higiene de los productos ofrecidos.</li>
            <li>Contar con todas las habilitaciones y permisos necesarios para operar.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Pagos y Facturación</h2>
          <p className="text-gray-700 leading-relaxed">
            Los comercios aceptan pagar las tarifas asociadas al plan elegido. Los pagos se procesan a través de
            Stripe, nuestro procesador de pagos. Al proporcionar información de pago, autorizás a Runbits a cobrar
            las tarifas correspondientes.
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li><strong>Plan Básico:</strong> Comisión porcentual sobre cada pedido procesado a través de la plataforma.</li>
            <li><strong>Plan Premium:</strong> Suscripción mensual fija más una comisión reducida por pedido.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Las tarifas pueden ser modificadas con un aviso previo de 30 días. Los impuestos aplicables serán
            responsabilidad del usuario según la legislación vigente.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Propiedad Intelectual</h2>
          <p className="text-gray-700 leading-relaxed">
            El Servicio y su contenido original, funcionalidades y diseño son propiedad de Runbits LLC y están
            protegidos por leyes de propiedad intelectual nacionales e internacionales. La marca &quot;Runbits&quot;,
            el logotipo y todos los elementos gráficos asociados son marcas registradas de Runbits LLC.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Los comercios retienen la propiedad de su contenido (fotos, descripciones de productos, etc.) pero
            otorgan a Runbits una licencia no exclusiva para mostrar dicho contenido en la plataforma.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Limitación de Responsabilidad</h2>
          <p className="text-gray-700 leading-relaxed">
            Runbits actúa como intermediario entre comercios, clientes y repartidores. En la máxima medida
            permitida por la ley:
          </p>
          <ul className="text-gray-700 space-y-2 list-disc pl-6">
            <li>Runbits no será responsable por la calidad de los productos ofrecidos por los comercios.</li>
            <li>Runbits no garantiza tiempos de entrega específicos, aunque se esfuerza por optimizarlos.</li>
            <li>En ningún caso Runbits será responsable por daños indirectos, incidentales, especiales o consecuentes.</li>
            <li>La responsabilidad total de Runbits no excederá el monto pagado por el usuario en los últimos 12 meses.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Terminación</h2>
          <p className="text-gray-700 leading-relaxed">
            Podemos suspender o terminar tu acceso al Servicio de forma inmediata, sin previo aviso, por cualquier
            motivo, incluyendo pero no limitado a la violación de estos Términos. Tras la terminación, tu derecho
            a utilizar el Servicio cesará inmediatamente.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Podés cancelar tu cuenta en cualquier momento siguiendo las instrucciones en nuestra{' '}
            <Link href="/cancellation" className="text-brand-600 hover:underline">Política de Cancelación</Link>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Modificaciones</h2>
          <p className="text-gray-700 leading-relaxed">
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en
            vigencia al ser publicados en esta página. El uso continuado del Servicio después de la publicación
            de cambios constituye la aceptación de los nuevos Términos.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Para cambios sustanciales, enviaremos una notificación por email a los usuarios registrados con al
            menos 15 días de anticipación.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Ley Aplicable y Jurisdicción</h2>
          <p className="text-gray-700 leading-relaxed">
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República Argentina, sin
            consideración a sus disposiciones sobre conflictos de leyes. Cualquier disputa será sometida a la
            jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, Argentina.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Contacto</h2>
          <p className="text-gray-700 leading-relaxed">
            Si tenés preguntas sobre estos Términos, podés contactarnos en:
          </p>
          <ul className="text-gray-700 space-y-1 list-none pl-0">
            <li><strong>Email:</strong> <a href="mailto:support@runbits.io" className="text-brand-600 hover:underline">support@runbits.io</a></li>
            <li><strong>Web:</strong> <a href="https://runbits.io" className="text-brand-600 hover:underline">runbits.io</a></li>
          </ul>
        </article>
      </main>

      {/* Simple footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Runbits LLC. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Reembolsos</Link>
            <Link href="/cancellation" className="hover:text-white transition-colors">Cancelación</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
