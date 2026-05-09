/**
 * Onboarding helpers — checklist steps and templates per business_type.
 *
 * Persistence model:
 * - profile.tutorial_completed (DB) — checklist dismissed forever (or finished)
 * - profile.tutorial_step (DB) — last navbar tour step seen (used by Tutorial.tsx)
 * - localStorage `runbits.onboarding.skipped.{profileId}` — JSON array of skipped step ids
 * - localStorage `runbits.onboarding.startedAt.{profileId}` — ISO when checklist first appeared (smart suggestions)
 */

export type BusinessType = 'food' | 'goods' | 'appointment' | 'task' | 'realtime' | 'food+appointment' | 'goods+appointment' | 'goods+task' | string

export type OnboardingStepId =
  | 'profile' // Profile data (phone/address)
  | 'item'    // First catalog/menu/service item
  | 'open'    // Open the store
  | 'channel' // Connect a sales channel (whatsapp/payments)
  | 'share'   // Share the storefront link
  | 'preview' // Visit storefront / test order

export type OnboardingStep = {
  id: OnboardingStepId
  label: string
  description: string
  href: string
  cta?: string
}

/**
 * Steps per business_type — copy is in Spanish; i18n is layered via t() in the component.
 * The keys returned (id, label, description, cta) are stable so consumers can map them
 * to translations: onboarding.steps.{id}.{label|description|cta}
 */
export function getStepsForBusinessType(type: BusinessType): OnboardingStep[] {
  const profile: OnboardingStep = {
    id: 'profile',
    label: 'Completar perfil',
    description: 'Cargá teléfono, dirección y datos básicos para que tus clientes puedan contactarte.',
    href: '/dashboard/settings',
    cta: 'Completar',
  }
  const open: OnboardingStep = {
    id: 'open',
    label: 'Abrir tu tienda',
    description: 'Activá tu tienda online para empezar a recibir pedidos.',
    href: '/dashboard/settings',
    cta: 'Abrir',
  }
  const channel: OnboardingStep = {
    id: 'channel',
    label: 'Conectar un canal de cobro',
    description: 'Configurá Mercado Pago, transferencia o efectivo para cobrar tus ventas.',
    href: '/dashboard/settings/payments',
    cta: 'Conectar',
  }
  const share: OnboardingStep = {
    id: 'share',
    label: 'Compartir tu tienda',
    description: 'Copiá el link de tu tienda y compartilo con tus clientes por WhatsApp o redes.',
    href: '/dashboard/settings/domain',
    cta: 'Ver link',
  }

  const itemFood: OnboardingStep = {
    id: 'item',
    label: 'Crear tu primer plato',
    description: 'Cargá tu primer plato o producto. Empezá con uno y agregá más después.',
    href: '/dashboard/menu',
    cta: 'Crear plato',
  }
  const itemGoods: OnboardingStep = {
    id: 'item',
    label: 'Cargar tu primer producto',
    description: 'Cargá tu primer producto con foto y precio. Después podés agregar stock y variantes.',
    href: '/dashboard/menu',
    cta: 'Crear producto',
  }
  const itemAppt: OnboardingStep = {
    id: 'item',
    label: 'Crear tu primer servicio',
    description: 'Cargá un servicio con duración y precio para empezar a recibir turnos.',
    href: '/dashboard/menu',
    cta: 'Crear servicio',
  }
  const itemTask: OnboardingStep = {
    id: 'item',
    label: 'Crear tu primer servicio',
    description: 'Cargá un trabajo con descripción y precio estimado para empezar a recibir cotizaciones.',
    href: '/dashboard/menu',
    cta: 'Crear servicio',
  }
  const itemRealtime: OnboardingStep = {
    id: 'item',
    label: 'Crear tu primer recurso',
    description: 'Cargá un recurso (cancha, cabaña, vehículo) para empezar a recibir reservas.',
    href: '/dashboard/menu',
    cta: 'Crear recurso',
  }

  switch (type) {
    case 'food':
      return [profile, itemFood, channel, open, share]
    case 'goods':
      return [profile, itemGoods, channel, open, share]
    case 'appointment':
      return [profile, itemAppt, channel, open, share]
    case 'task':
      return [profile, itemTask, channel, share]
    case 'realtime':
      return [profile, itemRealtime, channel, open, share]
    case 'food+appointment':
      return [profile, itemFood, itemAppt, channel, open, share]
    case 'goods+appointment':
      return [profile, itemGoods, itemAppt, channel, open, share]
    case 'goods+task':
      return [profile, itemGoods, itemTask, channel, share]
    default:
      return [profile, itemGoods, channel, open, share]
  }
}

// ─── Skipped steps (per profile, localStorage) ────────────────────────────────

const skippedKey = (profileId: string) => `runbits.onboarding.skipped.${profileId}`
const startedAtKey = (profileId: string) => `runbits.onboarding.startedAt.${profileId}`

export function getSkippedSteps(profileId: string): OnboardingStepId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(skippedKey(profileId))
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function skipStep(profileId: string, id: OnboardingStepId): void {
  if (typeof window === 'undefined') return
  const current = getSkippedSteps(profileId)
  if (current.includes(id)) return
  localStorage.setItem(skippedKey(profileId), JSON.stringify([...current, id]))
}

export function unskipAll(profileId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(skippedKey(profileId))
  localStorage.removeItem(startedAtKey(profileId))
}

export function ensureStartedAt(profileId: string): string {
  if (typeof window === 'undefined') return new Date().toISOString()
  const existing = localStorage.getItem(startedAtKey(profileId))
  if (existing) return existing
  const now = new Date().toISOString()
  localStorage.setItem(startedAtKey(profileId), now)
  return now
}

export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// ─── Smart suggestion ─────────────────────────────────────────────────────────

export type SmartSuggestion = {
  text: string
  cta?: string
  href?: string
}

/**
 * Returns a contextual tip for stalled onboarding, or null.
 * `daysIdle` = days since onboarding started without progress.
 */
export function getSmartSuggestion(opts: {
  businessType: string
  daysIdle: number
  hasItems: boolean
  hasOrders: boolean
  hasChannel: boolean
}): SmartSuggestion | null {
  const { daysIdle, hasItems, hasOrders, hasChannel } = opts

  if (!hasItems && daysIdle >= 3) {
    return {
      text: 'Hace varios días que no creás items. ¿Necesitás ayuda para empezar?',
      cta: 'Ver templates',
      href: '/dashboard/menu',
    }
  }
  if (hasItems && !hasOrders && daysIdle >= 5) {
    return {
      text: 'Tenés items pero todavía no recibiste pedidos. Compartí tu tienda con tus clientes.',
      cta: 'Compartir tienda',
      href: '/dashboard/settings/domain',
    }
  }
  if (hasItems && !hasChannel) {
    return {
      text: 'Falta conectar un método de cobro para que tus clientes puedan pagar online.',
      cta: 'Conectar pago',
      href: '/dashboard/settings/payments',
    }
  }
  return null
}
