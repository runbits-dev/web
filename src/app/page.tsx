import Link from 'next/link'

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="logo-runbits logo-runbits-dark text-2xl">
            RunBits
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              Cómo funciona
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              Planes
            </a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              Contacto
            </a>
            <Link href="/about" className="text-sm text-gray-600 hover:text-brand-700 transition-colors">
              Nosotros
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-brand-700 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/dashboard/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Registrar comercio
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-emerald-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          La plataforma que pone a tu negocio primero
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Tus clientes son tuyos.{' '}
          <span className="text-brand-600">Siempre.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A diferencia de las apps de delivery tradicionales, en Runbits los datos de tus clientes
          te pertenecen. No somos intermediarios — somos tu infraestructura. Tarifa fija, sin comisiones por venta.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          >
            Registrar mi comercio
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">100+</div>
            <div className="text-sm text-gray-500 mt-1">Comercios</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">5K+</div>
            <div className="text-sm text-gray-500 mt-1">Pedidos</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">50+</div>
            <div className="text-sm text-gray-500 mt-1">Repartidores</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyRunbits() {
  const comparisons = [
    {
      them: 'En PedidosYa / Rappi, tus clientes son de la plataforma',
      us: 'En Runbits, tus clientes son tuyos — vos tenés sus datos',
      icon: '👥',
    },
    {
      them: 'Te cobran 15-35% de comisión por cada venta',
      us: 'Tarifa fija mensual desde USD $49. Sin comisiones. Nunca.',
      icon: '💰',
    },
    {
      them: 'Tu negocio compite con miles en el mismo feed',
      us: 'Tu negocio tiene su propia tienda digital, sin competencia',
      icon: '🏪',
    },
    {
      them: 'Si te vas de la plataforma, perdés todo',
      us: 'Si te vas de Runbits, te llevás tu base de clientes',
      icon: '🔓',
    },
  ]

  return (
    <section className="py-20 bg-gray-50" id="why-runbits">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            ¿Por qué Runbits?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Somos como Shopify, pero para negocios que venden y entregan. No somos dueños de tus clientes — solo te damos la infraestructura para que conectes con ellos directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {comparisons.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <span className="text-2xl">{c.icon}</span>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 text-sm">✗</span>
                  <p className="text-sm text-gray-500 line-through">{c.them}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 text-sm">✓</span>
                  <p className="text-sm font-medium text-gray-900">{c.us}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base text-gray-700 font-medium max-w-xl mx-auto">
            Runbits no es un marketplace. Es <span className="text-brand-600 font-bold">tu plataforma</span> — donde vos controlás la relación con tus clientes, tus datos y tu marca.
          </p>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      title: 'App para clientes',
      description:
        'Tus clientes piden desde su celular. Catálogo digital, seguimiento en tiempo real y múltiples medios de pago.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.999 2.999 0 00.97-1.599L5.49 3h13.02l1.52 4.75A2.999 2.999 0 0021 9.349" />
        </svg>
      ),
      title: 'Panel de comercio',
      description:
        'Gestioná tu menú, controlá pedidos en tiempo real y accedé a estadísticas detalladas de tu negocio.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      title: 'Delivery flexible',
      description:
        'Usá tus propios repartidores o conectá con servicios de envío externos. Tracking GPS y verificación QR incluidos.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: 'Analytics en tiempo real',
      description:
        'Datos y métricas de tu negocio al instante. Ventas, productos más pedidos, horarios pico y más.',
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Todo lo que necesitás para vender más
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Herramientas diseñadas para que tu comercio crezca con entregas eficientes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-gray-50 rounded-2xl p-6 hover:bg-brand-50 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Registrá tu comercio',
      description:
        'Creá tu cuenta en minutos. Completá los datos de tu negocio y elegí el plan que mejor se adapte.',
    },
    {
      number: '02',
      title: 'Cargá tu menú',
      description:
        'Subí tus productos con fotos, precios y descripciones. Organizalos por categorías para que tus clientes encuentren todo fácil.',
    },
    {
      number: '03',
      title: 'Empezá a recibir pedidos',
      description:
        'Tu tienda online está lista. Compartí el link con tus clientes, recibí pedidos y gestioná todo desde el dashboard.',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Empezá en 3 simples pasos
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Ponemos tu negocio online en minutos, sin complicaciones.
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
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const checkIcon = (
    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )

  const plans = [
    {
      name: 'Starter',
      description: 'Para negocios que recién arrancan',
      billing: 'Tarifa fija — sin comisiones, nunca',
      price: '49',
      popular: false,
      highlighted: false,
      features: [
        'Pedidos ilimitados',
        'Menú ilimitado con variantes',
        'Tienda online propia',
        'Push notifications',
        'QR de verificación de entrega',
        'Estadísticas básicas',
        '14 días de prueba gratis',
      ],
      cta: 'Probar 14 días gratis',
    },
    {
      name: 'Growth',
      description: 'Para negocios en crecimiento',
      billing: 'Todo de Starter + herramientas de crecimiento',
      price: '129',
      popular: true,
      highlighted: true,
      features: [
        'Todo de Starter',
        'Dominio propio (tu-negocio.com)',
        'Colores y marca personalizados',
        '10 cupones + 5 promos activas',
        '3 campañas push/mes a tus clientes',
        'Analytics con gráficos y tendencias',
        'Verificación de clientes',
        'Soporte email 24h',
      ],
      cta: 'Elegir Growth',
    },
    {
      name: 'Pro',
      description: 'Para negocios que necesitan escalar',
      billing: 'Todo de Growth + escala y automatización',
      price: '299',
      popular: false,
      highlighted: false,
      features: [
        'Todo de Growth',
        'Cupones y promos ilimitados',
        'White-label (sin marca Runbits)',
        'Hasta 3 sucursales',
        '5 usuarios staff con roles',
        '50 generaciones IA/mes',
        'Webhooks + integraciones',
        'Chat prioritario',
      ],
      cta: 'Elegir Pro',
    },
    {
      name: 'Enterprise',
      description: 'Para cadenas y franquicias',
      billing: 'Todo ilimitado + soporte dedicado',
      price: '499',
      popular: false,
      highlighted: false,
      features: [
        'Todo de Pro, sin límites',
        'API REST completa',
        'Sucursales y staff ilimitados',
        'Facturación electrónica AFIP',
        'Verificación de clientes ilimitada',
        'Onboarding personalizado',
        'Account manager dedicado',
      ],
      cta: 'Elegir Enterprise',
    },
  ]

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Tarifa fija. Sin comisiones. Nunca.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Todos los planes incluyen pedidos y menú ilimitados. Pagás una tarifa fija mensual y te quedás con el 100% de tus ventas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 ring-2 ring-brand-600'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  Más elegido
                </div>
              )}
              <div>
                <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.highlighted ? 'text-brand-100' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>
              <div className="mt-6">
                {plan.price && plan.price !== '0' ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                        USD ${plan.price}
                      </span>
                      <span className={`text-sm ${plan.highlighted ? 'text-brand-200' : 'text-gray-500'}`}>/mes</span>
                    </div>
                    <p className={`mt-1 text-xs ${plan.highlighted ? 'text-brand-200' : 'text-gray-400'}`}>
                      {plan.billing}
                    </p>
                  </>
                ) : plan.price === '0' ? (
                  <>
                    <span className="text-4xl font-bold text-blue-600">
                      Gratis
                    </span>
                    <p className="mt-1 text-xs text-blue-500">
                      {plan.billing}
                    </p>
                  </>
                ) : (
                  <>
                    <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      A medida
                    </span>
                    <p className={`mt-1 text-xs ${plan.highlighted ? 'text-brand-200' : 'text-gray-400'}`}>
                      {plan.billing}
                    </p>
                  </>
                )}
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((item) => (
                  <li
                    key={item}
                    className={`flex items-start gap-3 text-sm ${
                      plan.highlighted ? 'text-brand-50' : 'text-gray-700'
                    }`}
                  >
                    <span className={plan.highlighted ? 'text-brand-300' : 'text-brand-500'}>
                      {checkIcon}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.price ? '/dashboard/register' : 'mailto:sales@runbits.io'}
                className={`mt-8 block w-full text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-brand-700 hover:bg-brand-50'
                    : (plan as any).trial
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 border-brand-600 text-brand-700 hover:bg-brand-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Todos los planes incluyen 14 días de prueba gratis. Sin tarjeta de crédito requerida.
          <br />
          ¿Necesitás algo diferente?{' '}
          <a href="mailto:sales@runbits.io" className="text-brand-600 hover:underline font-medium">
            Hablemos
          </a>
        </p>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            ¿Tenés preguntas?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Nuestro equipo está listo para ayudarte a empezar.
          </p>

          <div className="mt-10 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Escribinos por email</h3>
                <a
                  href="mailto:support@runbits.io"
                  className="mt-1 text-brand-600 hover:text-brand-700 font-medium text-lg"
                >
                  support@runbits.io
                </a>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                Respondemos en menos de 24 horas hábiles. Contanos sobre tu negocio y te ayudamos a elegir el mejor plan.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Respuesta en &lt;24hs
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sin compromiso
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="logo-runbits logo-runbits-light text-2xl">RunBits</span>
            <p className="mt-3 text-sm leading-relaxed">
              La plataforma de delivery que conecta comercios con clientes a través de entregas rápidas y confiables.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Planes
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  Política de Reembolsos
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-white transition-colors">
                  Política de Cancelación
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@runbits.io" className="hover:text-white transition-colors">
                  support@runbits.io
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
            &copy; {new Date().getFullYear()} Runbits LLC. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-500">
            Runbits LLC &mdash; Argentina
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WhyRunbits />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />
      <Footer />
    </main>
  )
}
