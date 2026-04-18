import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acerca de Runbits — Nuestra filosofía',
  description: 'Runbits no es un marketplace. Es tu infraestructura. Tus clientes son tuyos, siempre.',
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tus clientes son tuyos. Siempre.</h1>

        <div className="prose prose-lg text-gray-600 space-y-6">
          <p className="text-xl leading-relaxed">
            Runbits existe porque creemos que la relación entre un negocio y sus clientes
            no debería pertenecer a una plataforma de terceros.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">El problema</h2>
          <p>
            Las plataformas de delivery tradicionales —PedidosYa, Rappi, Uber Eats— funcionan
            con un modelo donde <strong>los clientes son de la plataforma, no del comercio</strong>.
            Cuando un usuario pide comida, su historial, sus preferencias y su contacto quedan
            en la base de datos de la plataforma. El comercio no tiene acceso directo a sus
            propios clientes.
          </p>
          <p>
            Además, cobran entre un 15% y un 35% de comisión por cada venta. Para un negocio
            con márgenes ajustados, eso puede ser la diferencia entre ser rentable o no.
          </p>
          <p>
            Y si el comercio decide irse de la plataforma, pierde todo: su historial, sus
            calificaciones, su base de clientes. Empieza de cero.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Nuestra solución</h2>
          <p>
            Runbits sigue el modelo <strong>Shopify</strong>: somos una plataforma SaaS que le
            da a cada negocio su propia infraestructura digital. No somos un marketplace donde
            los negocios compiten entre sí en un feed. Cada comercio tiene su propia tienda,
            su propia marca, y sus propios clientes.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 my-8">
            <h3 className="text-lg font-bold text-emerald-800 mb-4">Lo que nos hace diferentes</h3>
            <ul className="space-y-3 text-emerald-700">
              <li className="flex gap-2"><span className="font-bold">→</span> <span><strong>Tarifa fija mensual.</strong> Sin comisiones por venta. Nunca. El comercio conserva el 100% de sus ingresos.</span></li>
              <li className="flex gap-2"><span className="font-bold">→</span> <span><strong>Los datos son del comercio.</strong> Historial de clientes, preferencias, contacto — todo accesible y exportable.</span></li>
              <li className="flex gap-2"><span className="font-bold">→</span> <span><strong>Sin dependencia.</strong> Si el comercio se va de Runbits, se lleva su base de clientes. No hay lock-in.</span></li>
              <li className="flex gap-2"><span className="font-bold">→</span> <span><strong>Marca propia.</strong> Cada comercio tiene su tienda con su logo, sus colores, su identidad. No compite en un feed genérico.</span></li>
              <li className="flex gap-2"><span className="font-bold">→</span> <span><strong>Multi-vertical.</strong> No solo delivery de comida. Servicios, productos, reservas — la plataforma se adapta al negocio.</span></li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Cómo funciona</h2>
          <p>
            Un comercio se registra en Runbits, elige un plan (desde USD $49/mes), y en menos
            de 10 minutos tiene su tienda online funcionando: menú digital, pedidos, notificaciones
            push, tracking de entrega, cupones, estadísticas, y más.
          </p>
          <p>
            Sus clientes piden directamente desde la tienda del comercio (web o app), y toda la
            interacción —datos, historial, feedback— queda en manos del negocio.
          </p>
          <p>
            Nosotros solo proveemos la infraestructura. El negocio pone la marca, los productos,
            y la relación con sus clientes.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">La analogía</h2>
          <p>
            Si PedidosYa es un shopping donde tu negocio es un local más entre miles,
            <strong> Runbits es como Shopify</strong>: te da las herramientas para construir
            tu propia tienda, en tu propio espacio, con tu propia marca. El shopping atrae
            clientes al edificio; Shopify te da el edificio para que vos atraigas a los tuyos.
          </p>
          <p>
            La diferencia clave: en el shopping, si te vas, los clientes se quedan con el
            shopping. Con Runbits, si te vas, los clientes se van con vos.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12">Sobre nosotros</h2>
          <p>
            Runbits nace en Córdoba, Argentina — un país donde los negocios entienden lo que
            significa depender de intermediarios. Construimos la plataforma pensando en los
            comercios de Latinoamérica que quieren crecer sin ceder el control de su relación
            con sus clientes.
          </p>
          <p>
            Toda la infraestructura corre en Cloudflare Workers — edge computing global,
            costo operativo cercano a cero, y escalabilidad automática. Eso nos permite
            ofrecer precios que las plataformas tradicionales no pueden igualar.
          </p>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            Registrar mi comercio
          </Link>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Runbits. Todos los derechos reservados.</p>
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
