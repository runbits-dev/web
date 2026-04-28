import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acerca de Runbits — Tu plataforma de comercio digital',
  description: 'Runbits es la infraestructura digital para comercios locales. Vendé online con tu marca, sin comisiones, con control total de tus clientes.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">Runbits</Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Iniciar sesión</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tu negocio, tu plataforma.</h1>

        <div className="prose prose-lg text-gray-600 space-y-6">
          <p className="text-xl leading-relaxed">
            Runbits es la plataforma de comercio digital para negocios locales. Te damos las
            herramientas para vender online — con tu marca, tus clientes, y el 100% de tus ingresos.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Por qué existe Runbits</h2>
          <p>
            Los comercios locales merecen vender online sin ceder el control de su negocio.
            Creamos Runbits para que cualquier emprendedor o comerciante pueda tener su propia
            tienda digital, recibir pedidos, y crecer — de forma independiente, sin
            comisiones por venta, y con acceso directo a sus propios clientes.
          </p>
          <p>
            Creemos que la relación entre un negocio y sus clientes es del negocio, no de
            una plataforma de terceros. Cada dato, cada pedido, cada interacción pertenece
            al comercio que trabajó para conseguirla.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Cómo funciona</h2>
          <p>
            Registrate, configurá tu tienda en minutos, y empezá a recibir pedidos. Así de simple.
          </p>

          <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 my-8">
            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">01.</span>
                <span><strong>Registrate gratis.</strong> Creá tu cuenta y elegí tu tipo de negocio — productos, servicios, o ambos. Sin tarjeta de crédito requerida.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">02.</span>
                <span><strong>Configurá tu tienda.</strong> Subí tu catálogo con fotos y precios, personalizá colores y logo, y definí tus métodos de entrega y pago.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">03.</span>
                <span><strong>Recibí pedidos.</strong> Tus clientes compran desde tu tienda. Vos gestionás todo desde el dashboard — pedidos, stock, estadísticas, y más.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand-600 shrink-0">04.</span>
                <span><strong>Crecé sin límites.</strong> Activá módulos adicionales a medida que los necesitás — push notifications, bot de WhatsApp, tracking GPS, y más.</span>
              </li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Nuestros valores</h2>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 my-8">
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2"><span className="font-bold text-brand-600">→</span> <span><strong>Transparencia.</strong> Precios claros, sin sorpresas. Sabés exactamente lo que pagás cada mes.</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">→</span> <span><strong>Independencia.</strong> Tu tienda, tu marca, tus clientes. Nunca compartimos tu información con otros comercios.</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">→</span> <span><strong>Sin comisiones.</strong> Pagás una tarifa fija mensual y te quedás con el 100% de cada venta.</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">→</span> <span><strong>Tus clientes son tuyos.</strong> Accedé a tu base de datos, exportala, y llevátela si algún día decidís migrar. Sin lock-in.</span></li>
              <li className="flex gap-2"><span className="font-bold text-brand-600">→</span> <span><strong>Multi-vertical.</strong> No solo delivery de comida. Servicios, productos, reservas — la plataforma se adapta a tu negocio.</span></li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">La empresa</h2>
          <p>
            Runbits es desarrollado por <strong>Runbits.io LLC</strong>, empresa registrada en
            Wyoming, Estados Unidos. Nació con foco en los comercios de Latinoamérica — negocios
            que quieren crecer en el mundo digital sin ceder el control de lo que construyeron.
          </p>
          <p>
            Estamos comprometidos con construir una plataforma justa, accesible, y diseñada
            desde el primer día para que el éxito del comercio sea el nuestro.
          </p>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            Registrar mi comercio
          </Link>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Runbits.io LLC. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-gray-600">Privacidad</Link>
            <Link href="/terms" className="hover:text-gray-600">Términos</Link>
            <Link href="https://status.runbits.dev" className="hover:text-gray-600">Status</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
