"use client"

import { useState, useEffect } from 'react'

const TUTORIAL_STEPS = [
  {
    title: '¡Bienvenido a Runbits!',
    description: 'Te vamos a mostrar las secciones principales de tu panel. Toma menos de 1 minuto.',
    target: null,
    icon: '👋',
  },
  {
    title: 'Inicio',
    description: 'Acá ves un resumen rápido de tu negocio: pedidos activos, ingresos del día, y si tenés pasos pendientes del setup.',
    target: '/dashboard',
    icon: '🏠',
  },
  {
    title: 'Catálogo',
    description: 'Cargá tus productos con nombre, descripción, precio, categoría y foto. Tus clientes los ven en tu tienda online.',
    target: '/dashboard/menu',
    icon: '🍽️',
  },
  {
    title: 'Pedidos',
    description: 'Cuando un cliente hace un pedido, aparece acá. Podés ver el detalle, chatear con el cliente, y seguir el estado.',
    target: '/dashboard/orders',
    icon: '📦',
  },
  {
    title: 'Estadísticas',
    description: 'Datos de tu negocio: pedidos por día/semana/mes, ingresos, ticket promedio, y gráficos de tendencia.',
    target: '/dashboard/stats',
    icon: '📊',
  },
  {
    title: 'Marketing',
    description: 'Creá cupones de descuento y promociones con horario. Tus clientes los ven en tu tienda.',
    target: '/dashboard/marketing',
    icon: '🎯',
  },
  {
    title: 'Suscripción',
    description: 'Gestioná tu plan, vé tu uso, y hacé upgrade cuando necesites más features.',
    target: '/dashboard/subscription',
    icon: '💳',
  },
  {
    title: '¡Listo!',
    description: 'Ya conocés tu panel. El primer paso es cargar tus productos en el Catálogo. ¡Éxitos!',
    target: null,
    icon: '🚀',
  },
]

export function Tutorial() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const dismissed = localStorage.getItem('tutorial_dismissed')
      if (dismissed === 'true') return
      setShow(true)
      const savedStep = parseInt(localStorage.getItem('tutorial_step') || '0', 10)
      if (savedStep > 0 && savedStep < TUTORIAL_STEPS.length) setStep(savedStep)
    } catch {}
  }, [])

  useEffect(() => {
    if (mounted && show) {
      try { localStorage.setItem('tutorial_step', String(step)) } catch {}
    }
  }, [step, show, mounted])

  function dismiss() {
    localStorage.setItem('tutorial_dismissed', 'true')
    localStorage.removeItem('tutorial_step')
    setShow(false)
  }

  if (!mounted || !show) return null

  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1
  const isFirst = step === 0

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">{current?.icon}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">{current?.title}</h2>
          <p className="text-sm text-gray-600 text-center mt-3 leading-relaxed">{current?.description}</p>

          <div className="flex gap-3 mt-6">
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl font-semibold border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                ← Anterior
              </button>
            )}
            {isFirst && (
              <button onClick={() => setShow(false)} className="flex-1 py-2.5 rounded-xl font-semibold border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
                Después
              </button>
            )}
            <button
              onClick={() => isLast ? dismiss() : setStep(s => s + 1)}
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              {isLast ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">{step + 1} de {TUTORIAL_STEPS.length}</p>
            {!isFirst && !isLast && (
              <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">
                No mostrar más
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
