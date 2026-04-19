"use client"

import { useState, useEffect, useCallback } from 'react'

const TUTORIAL_STEPS = [
  { selector: '[data-tour="home"]', title: 'Inicio', description: 'Resumen de tu negocio: pedidos activos, ingresos, y pasos pendientes del setup.', position: 'right' as const },
  { selector: '[data-tour="menu"]', title: 'Catálogo', description: 'Cargá tus productos con nombre, precio, foto y categoría. Tus clientes los ven en tu tienda.', position: 'right' as const },
  { selector: '[data-tour="orders"]', title: 'Pedidos', description: 'Cuando un cliente pide, aparece acá. Podés ver el detalle y chatear con el cliente.', position: 'right' as const },
  { selector: '[data-tour="stats"]', title: 'Estadísticas', description: 'Pedidos por día, ingresos, ticket promedio, y gráficos de tendencia.', position: 'right' as const },
  { selector: '[data-tour="marketing"]', title: 'Marketing', description: 'Creá cupones de descuento y promociones con horario para tus clientes.', position: 'right' as const },
  { selector: '[data-tour="subscription"]', title: 'Suscripción', description: 'Revisá tu plan actual, tu consumo, y las opciones para escalar cuando lo necesites.', position: 'right' as const },
  { selector: '[data-tour="settings"]', title: 'Configuración', description: 'Datos de tu negocio, horarios, dirección, y personalización.', position: 'right' as const },
]

export function Tutorial() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
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

  const updatePosition = useCallback(() => {
    if (!show) return
    const current = TUTORIAL_STEPS[step]
    if (!current) return
    const el = document.querySelector(current.selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      setPos(null)
    }
  }, [step, show])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [updatePosition])

  useEffect(() => {
    if (mounted && show) {
      try { localStorage.setItem('tutorial_step', String(step)) } catch {}
    }
  }, [step, show, mounted])

  function dismiss() {
    try {
      localStorage.setItem('tutorial_dismissed', 'true')
      localStorage.removeItem('tutorial_step')
    } catch {}
    setShow(false)
  }

  if (!mounted || !show) return null

  const current = TUTORIAL_STEPS[step]
  if (!current) return null
  const isLast = step === TUTORIAL_STEPS.length - 1
  const isFirst = step === 0

  const tooltipTop = pos ? pos.top + pos.height / 2 - 80 : 200
  const tooltipLeft = pos ? pos.left + pos.width + 16 : 280

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[90]" style={{ background: 'rgba(0,0,0,0.4)' }} />

      {/* Highlight the target element */}
      {pos && (
        <div className="fixed z-[95] rounded-xl transition-all duration-300 pointer-events-none" style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
          boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)',
          border: '2px solid #059669',
          background: 'transparent',
        }} />
      )}

      {/* Tooltip */}
      <div className="fixed z-[100] w-72 bg-white rounded-2xl shadow-2xl p-5 transition-all duration-300" style={{
        top: Math.max(16, Math.min(tooltipTop, typeof window !== 'undefined' ? window.innerHeight - 250 : 500)),
        left: Math.max(16, tooltipLeft),
      }}>
        {/* Arrow pointing left */}
        <div className="absolute -left-2 top-20 w-4 h-4 bg-white rotate-45 shadow-sm" />

        <div className="relative">
          <p className="text-xs text-emerald-600 font-semibold mb-1">{step + 1} de {TUTORIAL_STEPS.length}</p>
          <h3 className="text-base font-bold text-gray-900">{current.title}</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{current.description}</p>

          <div className="flex gap-2 mt-4">
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                ←
              </button>
            )}
            {isFirst && (
              <button onClick={() => setShow(false)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-400 hover:bg-gray-50">
                Después
              </button>
            )}
            <button
              onClick={() => isLast ? setShow(false) : setStep(s => s + 1)}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700"
            >
              {isLast ? '¡Entendido!' : 'Siguiente →'}
            </button>
          </div>
          <button
            onClick={() => { if (window.confirm('¿Seguro que no querés ver más el tutorial? Podés reactivarlo en Configuración.')) dismiss() }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-3 w-full text-center"
          >
            No mostrar más
          </button>
        </div>
      </div>
    </>
  )
}
