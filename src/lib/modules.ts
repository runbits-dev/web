export type Module = {
  id: string
  name: string
  description: string
  price: number // USD/month, 0 = included in plan
  minPlan: 'free' | 'pro' | 'business' | 'enterprise'
  category: 'sales' | 'logistics' | 'communication' | 'operations'
  applicableTo: string[] // functional types: food, goods, appointment, task, realtime, or 'all'
}

export const MODULES: Module[] = [
  // Sales
  { id: 'coupons-basic', name: 'Cupones', description: 'Creá códigos de descuento para tus clientes.', price: 0, minPlan: 'free', category: 'sales', applicableTo: ['all'] },
  { id: 'promotions', name: 'Promociones', description: 'Happy hours, descuentos por tiempo limitado.', price: 0, minPlan: 'free', category: 'sales', applicableTo: ['all'] },
  { id: 'loyalty-program', name: 'Programa de fidelidad', description: 'Puntos y recompensas para clientes frecuentes.', price: 15, minPlan: 'pro', category: 'sales', applicableTo: ['all'] },
  { id: 'gift-cards', name: 'Tarjetas de regalo', description: 'Vendé gift cards digitales canjeables en tu tienda.', price: 10, minPlan: 'pro', category: 'sales', applicableTo: ['all'] },

  // Logistics
  { id: 'own-delivery', name: 'Delivery propio', description: 'Gestioná tus propios repartidores con tracking.', price: 0, minPlan: 'free', category: 'logistics', applicableTo: ['food', 'goods'] },
  { id: 'gps-tracking', name: 'Tracking GPS en vivo', description: 'Tus clientes ven el repartidor en tiempo real.', price: 20, minPlan: 'pro', category: 'logistics', applicableTo: ['food', 'goods', 'realtime'] },
  { id: 'multi-location', name: 'Multi-sucursal', description: 'Gestioná varias sucursales desde un solo dashboard.', price: 25, minPlan: 'business', category: 'logistics', applicableTo: ['all'] },
  { id: 'route-optimization', name: 'Optimización de rutas', description: 'Rutas automáticas para múltiples entregas.', price: 30, minPlan: 'business', category: 'logistics', applicableTo: ['food', 'goods', 'realtime'] },

  // Communication
  { id: 'push-campaigns', name: 'Campañas push', description: 'Enviá notificaciones push a tus clientes.', price: 0, minPlan: 'pro', category: 'communication', applicableTo: ['all'] },
  { id: 'whatsapp-bot', name: 'Bot de WhatsApp', description: 'Recibí pedidos y consultas por WhatsApp automáticamente.', price: 25, minPlan: 'enterprise', category: 'communication', applicableTo: ['all'] },
  { id: 'ai-assistant', name: 'Asistente IA', description: 'IA que responde consultas de tus clientes 24/7.', price: 20, minPlan: 'enterprise', category: 'communication', applicableTo: ['all'] },
  { id: 'email-marketing', name: 'Email marketing', description: 'Campañas de email automáticas a tu base de clientes.', price: 15, minPlan: 'business', category: 'communication', applicableTo: ['all'] },

  // Operations
  { id: 'inventory', name: 'Control de stock', description: 'Seguimiento de inventario con alertas de stock bajo.', price: 15, minPlan: 'free', category: 'operations', applicableTo: ['food', 'goods'] },
  { id: 'staff-management', name: 'Gestión de staff', description: 'Usuarios con roles y permisos por sucursal.', price: 0, minPlan: 'business', category: 'operations', applicableTo: ['all'] },
  { id: 'afip-billing', name: 'Facturación AFIP', description: 'Facturación electrónica automática para Argentina.', price: 15, minPlan: 'business', category: 'operations', applicableTo: ['all'] },
  { id: 'api-access', name: 'API REST', description: 'Acceso completo a la API para integraciones custom.', price: 0, minPlan: 'enterprise', category: 'operations', applicableTo: ['all'] },
  { id: 'webhooks', name: 'Webhooks', description: 'Notificaciones automáticas a tus sistemas externos.', price: 0, minPlan: 'business', category: 'operations', applicableTo: ['all'] },
  { id: 'white-label', name: 'White-label', description: 'Remové la marca Runbits de tu tienda.', price: 0, minPlan: 'business', category: 'operations', applicableTo: ['all'] },
]

export const MODULE_CATEGORIES = [
  { id: 'sales', label: 'Ventas' },
  { id: 'logistics', label: 'Logística' },
  { id: 'communication', label: 'Comunicación' },
  { id: 'operations', label: 'Operaciones' },
] as const

export const PLAN_ORDER = ['free', 'pro', 'business', 'enterprise'] as const

export function getModulesForType(businessType: string): Module[] {
  return MODULES.filter(m =>
    m.applicableTo.includes('all') || m.applicableTo.some(t => businessType.includes(t))
  )
}

export function isModuleIncludedInPlan(module: Module, currentPlan: string): boolean {
  const current = PLAN_ORDER.indexOf(currentPlan as any)
  const required = PLAN_ORDER.indexOf(module.minPlan as any)
  if (current === -1 || required === -1) return false
  return current >= required && module.price === 0
}

export function isModuleAvailableForPlan(module: Module, currentPlan: string): boolean {
  const current = PLAN_ORDER.indexOf(currentPlan as any)
  const required = PLAN_ORDER.indexOf(module.minPlan as any)
  if (current === -1 || required === -1) return false
  return current >= required
}
