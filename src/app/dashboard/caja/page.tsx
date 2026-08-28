"use client"

/**
 * Caja / Vender — in-store POS + cash register (caja) MVP.
 *
 * Two panels:
 *   - CAJA: open/close the cash drawer, record manual cash in/out movements,
 *     and read live totals. Closing produces a Z report (over/short).
 *   - VENDER (POS): a catalog grid → build a ticket → charge with a payment
 *     method. Cash tenders show the change. The order total is server-authoritative
 *     (we send items, the server returns total_cents) — never a client total.
 *
 * Error-handling rule: every fallible call is wrapped; failures surface the
 * server's friendly message + stable code (ApiError) and never leak internals.
 * Known coded errors are mapped to actionable Spanish prompts:
 *   REGISTER_NO_OPEN_SESSION → open the caja first (for cash sales)
 *   REGISTER_ALREADY_OPEN    → a caja is already open
 *   PLAN_LIMIT_EXCEEDED      → POS module not enabled in the plan
 *   POS_FORBIDDEN            → the account may not operate this POS
 */

import { useCallback, useEffect, useState } from 'react'
import {
  api,
  type ApiError,
  type RegisterCurrent,
  type RegisterCloseReport,
  type PosPaymentMethod,
} from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'

// ─── Types ──────────────────────────────────────────────────────────────────

type CatalogItem = {
  id: string
  name: string
  price: number // integer cents
  is_available?: boolean
  available?: number
}

type TicketLine = { item: CatalogItem; qty: number }

const PAYMENT_METHODS: { value: PosPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr', label: 'QR' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asApiError(err: unknown): ApiError {
  return err instanceof Error ? (err as ApiError) : (new Error('Error inesperado') as ApiError)
}

/** Integer cents → "$X.XX". Deterministic (no locale drift) for an MVP. */
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/** Pesos string (e.g. "12.50") → integer cents, or null when not a valid amount. */
function pesosToCents(value: string): number | null {
  const n = parseFloat(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function isAvailable(item: CatalogItem): boolean {
  if (item.is_available !== undefined) return item.is_available
  if (item.available !== undefined) return item.available === 1
  return true
}

/** Map a coded ApiError to a friendly, actionable Spanish message. */
function messageForError(e: ApiError): string {
  switch (e.code) {
    case 'REGISTER_NO_OPEN_SESSION':
      return 'Abrí la caja primero para cobrar en efectivo.'
    case 'REGISTER_ALREADY_OPEN':
      return 'Ya hay una caja abierta para este comercio.'
    case 'PLAN_LIMIT_EXCEEDED':
      return 'El módulo de caja/POS no está incluido en tu plan. Activalo desde tu suscripción.'
    case 'POS_FORBIDDEN':
      return 'No tenés permisos para operar esta caja.'
    default:
      return e.message || 'Ocurrió un error. Reintentá.'
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CajaPage() {
  const { activeProfile } = useProfile()
  const storeId = activeProfile?.store_id ?? null

  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<RegisterCurrent | null>(null)
  const [catalog, setCatalog] = useState<CatalogItem[]>([])

  const loadCaja = useCallback(async () => {
    if (!storeId) return
    try {
      const res = await api.registerCurrent(storeId)
      setCurrent(res)
    } catch {
      // A failed status read must not crash the page — treat as unknown/closed.
      setCurrent({ session: null })
    }
  }, [storeId])

  const loadCatalog = useCallback(async () => {
    if (!storeId) return
    try {
      const items = (await api.getMenu(storeId)) as CatalogItem[]
      setCatalog(Array.isArray(items) ? items.filter(isAvailable) : [])
    } catch {
      setCatalog([])
    }
  }, [storeId])

  useEffect(() => {
    if (!storeId) {
      setLoading(false)
      return
    }
    Promise.all([loadCaja(), loadCatalog()]).finally(() => setLoading(false))
  }, [storeId, loadCaja, loadCatalog])

  if (!storeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">Seleccioná un comercio para operar la caja.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-72 bg-slate-200 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 h-64" />
          <div className="bg-white rounded-2xl border border-slate-200 h-64" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Caja / Vender</h1>
        <p className="text-slate-500 text-sm mt-1">
          Punto de venta en el local y control de caja.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <CajaPanel current={current} storeId={storeId} onChanged={loadCaja} />
        <VenderPanel
          catalog={catalog}
          storeId={storeId}
          cajaOpen={!!current?.session}
          onSold={loadCaja}
        />
      </div>
    </div>
  )
}

// ─── CAJA panel ─────────────────────────────────────────────────────────────

function CajaPanel({
  current,
  storeId,
  onChanged,
}: {
  current: RegisterCurrent | null
  storeId: string
  onChanged: () => void | Promise<void>
}) {
  const session = current?.session ?? null

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Caja</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {session ? 'La caja está abierta.' : 'La caja está cerrada.'}
        </p>
      </header>

      {session ? (
        <OpenCaja current={current!} storeId={storeId} onChanged={onChanged} />
      ) : (
        <ClosedCaja storeId={storeId} onChanged={onChanged} />
      )}
    </section>
  )
}

function ClosedCaja({ storeId, onChanged }: { storeId: string; onChanged: () => void | Promise<void> }) {
  const [openingFloat, setOpeningFloat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zReport, setZReport] = useState<RegisterCloseReport | null>(null)

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cents = pesosToCents(openingFloat)
    if (cents === null) {
      setError('Ingresá un fondo inicial válido.')
      return
    }
    setBusy(true)
    try {
      await api.registerOpen(storeId, cents)
      setZReport(null)
      await onChanged()
    } catch (err) {
      setError(messageForError(asApiError(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {zReport && <ZReport report={zReport} />}

      <form onSubmit={handleOpen} className="space-y-3">
        <div>
          <label htmlFor="opening-float" className="text-xs font-semibold text-slate-600 mb-1 block">
            Fondo inicial (efectivo)
          </label>
          <input
            id="opening-float"
            inputMode="decimal"
            value={openingFloat}
            onChange={(e) => setOpeningFloat(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </form>
    </div>
  )
}

function OpenCaja({
  current,
  storeId,
  onChanged,
}: {
  current: RegisterCurrent
  storeId: string
  onChanged: () => void | Promise<void>
}) {
  const session = current.session!
  const [movementType, setMovementType] = useState<'in' | 'out' | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [closing, setClosing] = useState(false)
  const [countedCash, setCountedCash] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zReport, setZReport] = useState<RegisterCloseReport | null>(null)

  const stats: { label: string; cents: number }[] = [
    { label: 'Ventas en efectivo', cents: current.cashSalesCents ?? 0 },
    { label: 'Ingresos', cents: current.cashInCents ?? 0 },
    { label: 'Egresos', cents: current.cashOutCents ?? 0 },
    { label: 'Efectivo esperado', cents: current.expectedCashCents ?? session.opening_float_cents },
  ]

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!movementType) return
    const cents = pesosToCents(amount)
    if (cents === null || cents === 0) {
      setError('Ingresá un monto válido.')
      return
    }
    setBusy(true)
    try {
      await api.registerMovement(storeId, movementType, cents, reason.trim() || undefined)
      setMovementType(null)
      setAmount('')
      setReason('')
      await onChanged()
    } catch (err) {
      setError(messageForError(asApiError(err)))
    } finally {
      setBusy(false)
    }
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cents = pesosToCents(countedCash)
    if (cents === null) {
      setError('Ingresá el efectivo contado.')
      return
    }
    setBusy(true)
    try {
      const report = await api.registerClose(storeId, cents)
      setZReport(report)
      setClosing(false)
      setCountedCash('')
      await onChanged()
    } catch (err) {
      setError(messageForError(asApiError(err)))
    } finally {
      setBusy(false)
    }
  }

  if (zReport) {
    return <ZReport report={zReport} />
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <dt className="text-[11px] uppercase tracking-wide text-slate-400">Fondo inicial</dt>
          <dd className="text-sm font-semibold text-slate-800">{formatCents(session.opening_float_cents)}</dd>
        </div>
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-slate-400">{s.label}</dt>
            <dd className="text-sm font-semibold text-slate-800">{formatCents(s.cents)}</dd>
          </div>
        ))}
      </dl>

      {typeof current.orderCount === 'number' && (
        <p className="text-xs text-slate-400">Ventas registradas: {current.orderCount}</p>
      )}

      {/* Manual cash movements */}
      {movementType ? (
        <form onSubmit={handleMovement} className="space-y-3 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-600">
            {movementType === 'in' ? 'Registrar ingreso de efectivo' : 'Registrar egreso de efectivo'}
          </p>
          <div>
            <label htmlFor="movement-amount" className="text-xs font-semibold text-slate-600 mb-1 block">
              Monto
            </label>
            <input
              id="movement-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="movement-reason" className="text-xs font-semibold text-slate-600 mb-1 block">
              Motivo (opcional)
            </label>
            <input
              id="movement-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. pago a proveedor"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? 'Registrando...' : 'Registrar movimiento'}
            </button>
            <button
              type="button"
              onClick={() => { setMovementType(null); setError(null) }}
              className="text-sm font-semibold text-slate-500 px-3 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : closing ? (
        <form onSubmit={handleClose} className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div>
            <label htmlFor="counted-cash" className="text-xs font-semibold text-slate-600 mb-1 block">
              Efectivo contado
            </label>
            <input
              id="counted-cash"
              inputMode="decimal"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
            <button
              type="button"
              onClick={() => { setClosing(false); setError(null) }}
              className="text-sm font-semibold text-slate-500 px-3 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setMovementType('in'); setError(null) }}
            className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100"
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => { setMovementType('out'); setError(null) }}
            className="text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg hover:bg-amber-100"
          >
            Egreso
          </button>
          <button
            type="button"
            onClick={() => { setClosing(true); setError(null) }}
            className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 ml-auto"
          >
            Cerrar caja
          </button>
          {error && <p className="text-sm text-red-600 w-full">{error}</p>}
        </div>
      )}
    </div>
  )
}

function ZReport({ report }: { report: RegisterCloseReport }) {
  const over = report.overShortCents
  const overLabel = over === 0 ? 'Cuadra' : over > 0 ? 'Sobrante' : 'Faltante'
  const overCls = over === 0 ? 'text-slate-600' : over > 0 ? 'text-emerald-600' : 'text-red-600'

  const rows: { label: string; value: string }[] = [
    { label: 'Fondo inicial', value: formatCents(report.openingFloatCents) },
    { label: 'Ventas en efectivo', value: formatCents(report.cashSalesCents) },
    { label: 'Ingresos', value: formatCents(report.cashInCents) },
    { label: 'Egresos', value: formatCents(report.cashOutCents) },
    { label: 'Efectivo esperado', value: formatCents(report.expectedCashCents) },
    { label: 'Efectivo contado', value: formatCents(report.countedCashCents) },
    { label: 'Ventas', value: String(report.orderCount) },
  ]

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Cierre de caja (Z)</h3>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="font-medium text-slate-800">{r.value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2 mt-2">
          <dt className={`font-semibold ${overCls}`}>{overLabel}</dt>
          <dd className={`font-bold ${overCls}`}>{formatCents(Math.abs(over))}</dd>
        </div>
      </dl>
    </div>
  )
}

// ─── VENDER (POS) panel ───────────────────────────────────────────────────────

function VenderPanel({
  catalog,
  storeId,
  cajaOpen,
  onSold,
}: {
  catalog: CatalogItem[]
  storeId: string
  cajaOpen: boolean
  onSold: () => void | Promise<void>
}) {
  const [ticket, setTicket] = useState<TicketLine[]>([])
  const [note, setNote] = useState('')
  const [charging, setCharging] = useState(false)
  const [method, setMethod] = useState<PosPaymentMethod | null>(null)
  const [amountTendered, setAmountTendered] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ changeCents: number; method: PosPaymentMethod } | null>(null)
  // Retry-safety: an order is created BEFORE it is paid. If the pay fails we keep
  // the created order id + its idempotency key so the next "Cobrar" re-pays the
  // SAME order (server pay is idempotent) instead of creating a duplicate sale.
  // Editing the ticket invalidates the created order, so we clear both then.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const total = ticket.reduce((sum, l) => sum + l.item.price * l.qty, 0)

  /** The created order no longer matches the ticket → start fresh next Cobrar. */
  function clearPending() {
    setPendingOrderId(null)
    setPendingKey(null)
  }

  function addItem(item: CatalogItem) {
    setSuccess(null)
    clearPending()
    setTicket((prev) => {
      const existing = prev.find((l) => l.item.id === item.id)
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { item, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    clearPending()
    setTicket((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )
  }

  function resetSale() {
    setTicket([])
    setNote('')
    setCharging(false)
    setMethod(null)
    setAmountTendered('')
    setError(null)
    clearPending()
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!method) {
      setError('Elegí un medio de pago.')
      return
    }
    let tenderedCents: number | undefined
    if (method === 'cash') {
      const cents = pesosToCents(amountTendered)
      if (cents === null) {
        setError('Ingresá el monto recibido.')
        return
      }
      if (cents < total) {
        setError('El monto recibido es menor al total.')
        return
      }
      tenderedCents = cents
    }
    setBusy(true)
    try {
      // Re-pay path: a prior attempt already created the order (pay failed after
      // create). Re-pay the SAME order — never create a second one for the ticket.
      let orderId = pendingOrderId
      if (!orderId) {
        const lines = ticket.map((l) => ({ menuItemId: l.item.id, quantity: l.qty }))
        // Reuse an existing key (create succeeded but pay failed, or a create was
        // retried) so the server dedups; otherwise mint one for this sale.
        const key = pendingKey ?? crypto.randomUUID()
        setPendingKey(key)
        const order = await api.posCreateOrder(storeId, lines, note.trim() || undefined, key)
        // Persist the id BEFORE paying so a pay failure re-pays this same order.
        orderId = order.id
        setPendingOrderId(order.id)
      }
      const payRes = await api.posPayOrder(orderId, method, tenderedCents)
      setSuccess({ changeCents: payRes.changeCents, method })
      resetSale()
      await onSold()
    } catch (err) {
      // Keep pendingOrderId + pendingKey so the next Cobrar re-pays this order.
      setError(messageForError(asApiError(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Vender</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tocá un producto para agregarlo al ticket.</p>
      </header>

      {success && (
        <div role="status" className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-sm font-semibold text-emerald-700">Pago registrado.</p>
          {success.method === 'cash' && (
            <p className="text-sm text-emerald-700">Vuelto: {formatCents(success.changeCents)}</p>
          )}
        </div>
      )}

      {!cajaOpen && (
        <p className="text-xs text-amber-600 mb-3">
          La caja está cerrada. Podés cobrar con tarjeta, transferencia o QR; para efectivo, abrí la caja.
        </p>
      )}

      {/* Catalog grid */}
      {catalog.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">No hay productos disponibles en el catálogo.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item)}
              className="text-left rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <span className="block text-sm font-medium text-slate-800 leading-tight">{item.name}</span>
              <span className="block text-xs text-slate-500 mt-1">{formatCents(item.price)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Ticket */}
      <div className="rounded-xl border border-slate-200 p-3">
        {ticket.length === 0 ? (
          <p className="text-sm text-slate-400">El ticket está vacío.</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {ticket.map((l) => (
              <li key={l.item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{l.item.name}</span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Quitar uno de ${l.item.name}`}
                    onClick={() => changeQty(l.item.id, -1)}
                    className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold leading-none"
                  >
                    −
                  </button>
                  <span className="w-6 text-center tabular-nums">{l.qty}</span>
                  <button
                    type="button"
                    aria-label={`Agregar uno de ${l.item.name}`}
                    onClick={() => changeQty(l.item.id, 1)}
                    className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold leading-none"
                  >
                    +
                  </button>
                  <span className="w-16 text-right text-slate-700 tabular-nums">
                    {formatCents(l.item.price * l.qty)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm font-bold text-slate-900">Total: {formatCents(total)}</p>

        {!charging ? (
          <button
            type="button"
            disabled={ticket.length === 0}
            onClick={() => { setCharging(true); setSuccess(null); setError(null) }}
            className="mt-3 w-full text-sm font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Cobrar
          </button>
        ) : (
          <form onSubmit={handlePay} className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Medio de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    aria-pressed={method === pm.value}
                    className={`text-sm font-semibold px-3 py-2 rounded-lg border ${
                      method === pm.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {method === 'cash' && (
              <div>
                <label htmlFor="amount-tendered" className="text-xs font-semibold text-slate-600 mb-1 block">
                  Monto recibido
                </label>
                <input
                  id="amount-tendered"
                  inputMode="decimal"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="sale-note" className="text-xs font-semibold text-slate-600 mb-1 block">
                Nota (opcional)
              </label>
              <input
                id="sale-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. para llevar"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {busy ? 'Cobrando...' : 'Confirmar pago'}
              </button>
              <button
                type="button"
                onClick={() => { setCharging(false); setMethod(null); setAmountTendered(''); setError(null) }}
                className="text-sm font-semibold text-slate-500 px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
