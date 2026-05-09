"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useProfile } from '@/context/ProfileContext'
import { api } from '@/lib/api'

type TutorialStep = { selector: string; title: string; description: string }

function getStepsForBusinessType(type: string): TutorialStep[] {
  const home: TutorialStep = { selector: '[data-tour="home"]', title: 'Inicio', description: 'Resumen de tu actividad: pedidos activos, ingresos del día, y pasos pendientes.' }
  const stats: TutorialStep = { selector: '[data-tour="stats"]', title: 'Estadísticas', description: 'Pedidos por día, ingresos, ticket promedio, y gráficos de tendencia.' }
  const marketing: TutorialStep = { selector: '[data-tour="marketing"]', title: 'Marketing', description: 'Creá cupones de descuento y promociones con horario para tus clientes.' }
  const modules: TutorialStep = { selector: '[data-tour="modules"]', title: 'Módulos', description: 'Ampliá tu negocio con módulos adicionales: tracking GPS, WhatsApp bot, fidelidad, y más.' }
  const subscription: TutorialStep = { selector: '[data-tour="subscription"]', title: 'Suscripción', description: 'Revisá tu plan actual y las opciones para escalar.' }
  const settings: TutorialStep = { selector: '[data-tour="settings"]', title: 'Configuración', description: 'Datos de tu negocio, horarios, dirección, perfiles, y personalización.' }

  switch (type) {
    case 'food':
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Menú', description: 'Cargá tus platos con nombre, precio, foto y categoría. Tus clientes los ven en tu tienda.' },
        { selector: '[data-tour="orders"]', title: 'Pedidos', description: 'Cuando un cliente hace un pedido, aparece acá. Podés confirmar, preparar y marcar como listo.' },
        stats, marketing, modules, subscription, settings,
      ]
    case 'goods':
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Catálogo', description: 'Cargá tus productos con nombre, precio, foto y categoría.' },
        { selector: '[data-tour="orders"]', title: 'Pedidos', description: 'Cuando un cliente compra, el pedido aparece acá. Gestioná envíos y estados.' },
        stats, marketing, modules, subscription, settings,
      ]
    case 'appointment':
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Servicios', description: 'Cargá los servicios que ofrecés con duración y precio.' },
        { selector: '[data-tour="orders"]', title: 'Turnos', description: 'Acá aparecen las reservas de tus clientes. Confirmá, reprogramá o cancelá.' },
        stats, marketing, modules, subscription, settings,
      ]
    case 'task':
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Servicios', description: 'Cargá los trabajos que ofrecés con descripción y precio estimado.' },
        { selector: '[data-tour="orders"]', title: 'Trabajos', description: 'Acá aparecen las solicitudes de trabajo. Presupuestá, aceptá y marcá como completado.' },
        stats, marketing, modules, subscription, settings,
      ]
    case 'realtime':
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Servicios', description: 'Configurá los tipos de servicio que ofrecés (viajes, envíos, etc.).' },
        { selector: '[data-tour="orders"]', title: 'Viajes', description: 'Acá aparecen las solicitudes en tiempo real. Aceptá, seguí el recorrido y completá.' },
        stats, marketing, modules, subscription, settings,
      ]
    default:
      return [
        home,
        { selector: '[data-tour="menu"]', title: 'Catálogo', description: 'Cargá lo que ofrecés con nombre, precio y categoría.' },
        { selector: '[data-tour="orders"]', title: 'Pedidos', description: 'Cuando un cliente pide, aparece acá.' },
        stats, marketing, modules, subscription, settings,
      ]
  }
}

export function Tutorial() {
  const { activeProfile, refreshProfiles } = useProfile()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  const steps = useMemo(() =>
    getStepsForBusinessType(activeProfile?.business_type ?? 'goods'),
    [activeProfile?.business_type]
  )

  useEffect(() => {
    setMounted(true)
    if (!activeProfile) return
    if (activeProfile.tutorial_completed) return
    setShow(true)
    if (activeProfile.tutorial_step > 0 && activeProfile.tutorial_step < steps.length) {
      setStep(activeProfile.tutorial_step)
    }
  }, [activeProfile, steps.length])

  const updatePosition = useCallback(() => {
    if (!show) return
    const current = steps[step]
    if (!current) return
    const el = document.querySelector(current.selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      setPos(null)
    }
  }, [step, show, steps])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [updatePosition])

  useEffect(() => {
    if (mounted && show && activeProfile) {
      api.updateProfile(activeProfile.id, { tutorialStep: step }).catch(() => {})
    }
  }, [step, show, mounted])

  function dismiss() {
    if (activeProfile) {
      api.updateProfile(activeProfile.id, { tutorialCompleted: true, tutorialStep: step }).then(() => refreshProfiles()).catch(() => {})
    }
    setShow(false)
  }

  if (!mounted || !show) return null

  const current = steps[step]
  if (!current) return null
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  const tooltipTop = pos ? pos.top + pos.height / 2 - 80 : 200
  const tooltipLeft = pos ? pos.left + pos.width + 16 : 280

  return (
    <>
      <div className="fixed inset-0 z-[90]" style={{ background: 'rgba(0,0,0,0.4)' }} />

      {pos && (
        <div className="fixed z-[95] rounded-xl transition-all duration-300 pointer-events-none" style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
          boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)',
          border: '2px solid #4f46e5',
          background: 'transparent',
        }} />
      )}

      <div className="fixed z-[100] w-72 bg-white rounded-2xl shadow-2xl p-5 transition-all duration-300" style={{
        top: Math.max(16, Math.min(tooltipTop, typeof window !== 'undefined' ? window.innerHeight - 250 : 500)),
        left: Math.max(16, tooltipLeft),
      }}>
        <div className="absolute -left-2 top-20 w-4 h-4 bg-white rotate-45 shadow-sm" />

        <div className="relative">
          <p className="text-xs text-indigo-600 font-semibold mb-1">{step + 1} de {steps.length}</p>
          <h3 className="text-base font-bold text-gray-900">{current.title}</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{current.description}</p>

          <div className="flex gap-2 mt-4">
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Anterior
              </button>
            )}
            <button
              onClick={() => setShow(false)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50"
              title="Pausar — podés volver desde Configuración"
            >
              Después
            </button>
            <button
              onClick={() => isLast ? dismiss() : setStep(s => s + 1)}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700"
            >
              {isLast ? 'Entendido' : 'Siguiente'}
            </button>
          </div>
          <button
            onClick={() => { if (window.confirm('No vas a volver a ver el tutorial. Podés reactivarlo en Configuración.')) dismiss() }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-3 w-full text-center"
          >
            No mostrar más
          </button>
        </div>
      </div>
    </>
  )
}
