/**
 * Item templates per business_type — used to pre-fill the "create item" form
 * in /dashboard/menu so the user just edits and saves.
 *
 * Each template carries: label (button), name, description, price (USD with 2 decimals),
 * category, and optional unit/duration_minutes/track_stock flags that downstream
 * forms can pick up if they support them.
 */

export type ItemTemplate = {
  label: string
  name: string
  description: string
  price: number      // price in major units (e.g. 12.50 = 12.50 ARS/USD)
  category?: string
  unit?: string
  duration_minutes?: number
  track_stock?: boolean
}

const FOOD_TEMPLATES: ItemTemplate[] = [
  { label: 'Pizza',      name: 'Pizza Margarita',  description: 'Pizza clásica con muzzarella, tomate y albahaca.', price: 12.00, category: 'Principales', unit: 'porción' },
  { label: 'Hamburguesa',name: 'Hamburguesa clásica', description: 'Hamburguesa de carne 200g, lechuga, tomate y queso.', price: 8.00, category: 'Principales', unit: 'unidad' },
  { label: 'Plato del día', name: 'Plato del día', description: 'Tu plato especial cambia cada día.', price: 10.00, category: 'Principales', unit: 'unidad' },
  { label: 'Bebida',     name: 'Coca Cola 500ml',  description: 'Bebida gaseosa fría.', price: 3.00, category: 'Bebidas', unit: 'unidad' },
  { label: 'Postre',     name: 'Flan casero',      description: 'Flan con dulce de leche y crema.', price: 4.50, category: 'Postres', unit: 'porción' },
]

const APPOINTMENT_TEMPLATES: ItemTemplate[] = [
  { label: 'Corte de pelo', name: 'Corte de pelo', description: 'Corte clásico con lavado incluido.',   price: 15.00, category: 'Cortes', duration_minutes: 30 },
  { label: 'Color',         name: 'Coloración',     description: 'Coloración completa con productos premium.', price: 50.00, category: 'Color', duration_minutes: 90 },
  { label: 'Tratamiento',   name: 'Tratamiento capilar', description: 'Tratamiento de hidratación profunda.',   price: 35.00, category: 'Tratamientos', duration_minutes: 60 },
  { label: 'Consulta',      name: 'Consulta',       description: 'Consulta profesional inicial.',         price: 40.00, category: 'Consultas', duration_minutes: 30 },
  { label: 'Manicura',      name: 'Manicura',       description: 'Manicura completa con esmaltado.',      price: 12.00, category: 'Manos y pies', duration_minutes: 45 },
]

const TASK_TEMPLATES: ItemTemplate[] = [
  { label: 'Visita técnica', name: 'Visita técnica', description: 'Visita de diagnóstico al domicilio.', price: 20.00, category: 'Consultas' },
  { label: 'Reparación',     name: 'Reparación',     description: 'Reparación estándar (cotizable).',    price: 50.00, category: 'Trabajos' },
  { label: 'Instalación',    name: 'Instalación',    description: 'Instalación de equipos / sistema.',   price: 80.00, category: 'Trabajos' },
  { label: 'Mantenimiento',  name: 'Mantenimiento mensual', description: 'Mantenimiento preventivo.',  price: 35.00, category: 'Mantenimiento' },
]

const REALTIME_TEMPLATES: ItemTemplate[] = [
  { label: 'Cancha 60min', name: 'Cancha de fútbol 60 min', description: 'Cancha de fútbol 5 con luz, 60 minutos.', price: 30.00, category: 'Canchas', duration_minutes: 60 },
  { label: 'Cancha 90min', name: 'Cancha de fútbol 90 min', description: 'Cancha de fútbol 5 con luz, 90 minutos.', price: 45.00, category: 'Canchas', duration_minutes: 90 },
  { label: 'Cancha 120min',name: 'Cancha de fútbol 120 min', description: 'Cancha de fútbol 5 con luz, 120 minutos.', price: 60.00, category: 'Canchas', duration_minutes: 120 },
  { label: 'Habitación',   name: 'Habitación doble',        description: 'Habitación doble con baño privado.',     price: 80.00, category: 'Habitaciones' },
  { label: 'Cabaña',       name: 'Cabaña 4 personas',       description: 'Cabaña para 4 personas, vista al lago.', price: 120.00, category: 'Cabañas' },
]

export function getTemplatesForBusinessType(type: string | null | undefined): ItemTemplate[] {
  switch (type) {
    case 'food': return FOOD_TEMPLATES
    case 'appointment': return APPOINTMENT_TEMPLATES
    case 'task': return TASK_TEMPLATES
    case 'realtime': return REALTIME_TEMPLATES
    case 'food+appointment': return [...FOOD_TEMPLATES, ...APPOINTMENT_TEMPLATES]
    default: return FOOD_TEMPLATES
  }
}

/** Smart placeholder for the name field per business_type. */
export function getNamePlaceholder(type: string | null | undefined): string {
  switch (type) {
    case 'food': return 'Ej: Pizza Margarita'
    case 'appointment': return 'Ej: Corte de pelo'
    case 'task': return 'Ej: Visita técnica'
    case 'realtime': return 'Ej: Cancha de fútbol 60 min'
    default: return 'Ej: Pizza Margarita'
  }
}
