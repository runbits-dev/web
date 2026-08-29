/**
 * Integration tests for the Caja / Vender (POS + cash register) dashboard page.
 *
 * The page drives the in-store point of sale MVP: open/close the caja, record
 * cash movements, and sell from the store catalog. We mock the api methods
 * (not global fetch) and assert the flows + coded-error handling that matter:
 *   - open-caja flow calls registerOpen and reflects the open session
 *   - a cash sale with an open caja creates + pays the order and shows change
 *   - a cash sale with NO open caja surfaces REGISTER_NO_OPEN_SESSION as a prompt
 *   - closing the caja renders the Z report with the over/short figure
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

vi.mock('@/context/ProfileContext', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    registerCurrent: vi.fn(),
    registerOpen: vi.fn(),
    registerMovement: vi.fn(),
    registerClose: vi.fn(),
    registerSessions: vi.fn(),
    getMenu: vi.fn(),
    posCreateOrder: vi.fn(),
    posPayOrder: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import { useProfile } from '@/context/ProfileContext'
import CajaPage from './page'

const m = api as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockedUseProfile = vi.mocked(useProfile)

/** Default ProfileContext value: a store is selected with a fixed catalog. */
const PROFILE_CTX = {
  activeProfile: { id: 'p1', store_id: 'store-1', business_type: 'restaurant', display_name: 'Café Co' },
  profiles: [],
  switchProfile: vi.fn(),
  refreshProfiles: vi.fn(),
  loading: false,
} as unknown as ReturnType<typeof useProfile>

const OPEN_SESSION = {
  id: 's1',
  store_id: 'store-1',
  status: 'open',
  opening_float_cents: 10000,
  opened_at: 1,
}

const OPEN_CURRENT = {
  session: OPEN_SESSION,
  cashSalesCents: 20000,
  cashInCents: 0,
  cashOutCents: 0,
  expectedCashCents: 30000,
  orderCount: 4,
}

const MENU = [
  { id: 'm1', name: 'Café', price: 1500, is_available: true },
  { id: 'm2', name: 'Medialuna', price: 800, is_available: true },
]

function apiError(message: string, code: string, status: number) {
  const e = new Error(message) as Error & { code?: string; status?: number }
  e.code = code
  e.status = status
  return e
}

beforeEach(() => {
  localStorage.setItem('token', 'tok-test')
  mockedUseProfile.mockReturnValue(PROFILE_CTX)
  m.getMenu.mockResolvedValue(MENU)
  m.registerCurrent.mockResolvedValue({ session: null })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
})

describe('CajaPage — open the caja', () => {
  it('opens the caja with the entered float and reflects the open session', async () => {
    m.registerCurrent
      .mockResolvedValueOnce({ session: null })
      .mockResolvedValue({ ...OPEN_CURRENT, cashSalesCents: 0, expectedCashCents: 10000, orderCount: 0 })
    m.registerOpen.mockResolvedValue({ session: OPEN_SESSION })

    render(<CajaPage />)

    // Closed state → the opening-float form is shown.
    const float = await screen.findByLabelText('Fondo inicial (efectivo)')
    fireEvent.change(float, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }))

    await waitFor(() => expect(m.registerOpen).toHaveBeenCalledWith('store-1', 10000))
    // Open state → live totals visible.
    expect(await screen.findByText('Efectivo esperado')).toBeInTheDocument()
    // Opening float and expected cash both read $100.00 on a fresh open.
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0)
  })
})

describe('CajaPage — cash sale', () => {
  it('creates + pays a cash order and shows the change when the caja is open', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.posCreateOrder.mockResolvedValue({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
    m.posPayOrder.mockResolvedValue({
      orderId: 'o1', status: 'paid', paymentMethod: 'cash', totalCents: 1500, changeCents: 500, registerSessionId: 's1',
    })

    render(<CajaPage />)

    // Catalog loaded → add a product to the ticket.
    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    expect(screen.getByText(/Total:\s*\$15\.00/)).toBeInTheDocument()

    // Charge → cash tender → confirm.
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    await waitFor(() =>
      expect(m.posCreateOrder).toHaveBeenCalledWith('store-1', [{ menuItemId: 'm1', quantity: 1 }], undefined, expect.any(String)),
    )
    expect(m.posPayOrder).toHaveBeenCalledWith('o1', 'cash', 2000)
    expect(await screen.findByText(/Vuelto:\s*\$5\.00/)).toBeInTheDocument()
  })

  it('prompts to open the caja when a cash sale returns REGISTER_NO_OPEN_SESSION', async () => {
    m.registerCurrent.mockResolvedValue({ session: null })
    m.posCreateOrder.mockResolvedValue({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
    m.posPayOrder.mockRejectedValue(apiError('no hay una caja abierta', 'REGISTER_NO_OPEN_SESSION', 409))

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    expect(await screen.findByText(/Abrí la caja/)).toBeInTheDocument()
  })
})

describe('CajaPage — sale retry-safety', () => {
  it('re-pays the SAME order after a failed pay without creating a duplicate', async () => {
    // Caja closed → first pay rejects; then the caja is opened and the retry succeeds.
    m.registerCurrent.mockResolvedValue({ session: null })
    m.posCreateOrder.mockResolvedValue({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
    m.posPayOrder
      .mockRejectedValueOnce(apiError('no hay una caja abierta', 'REGISTER_NO_OPEN_SESSION', 409))
      .mockResolvedValue({
        orderId: 'o1', status: 'paid', paymentMethod: 'cash', totalCents: 1500, changeCents: 500, registerSessionId: 's1',
      })

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    // First attempt: order created once, pay failed → prompt to open the caja.
    expect(await screen.findByText(/Abrí la caja/)).toBeInTheDocument()
    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(1))
    expect(m.posCreateOrder).toHaveBeenCalledWith(
      'store-1', [{ menuItemId: 'm1', quantity: 1 }], undefined, expect.any(String),
    )

    // User opens the caja, then clicks Confirmar pago again → re-pay same order.
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    expect(await screen.findByText(/Vuelto:\s*\$5\.00/)).toBeInTheDocument()
    // No duplicate order: create stays at ONE; pay called twice with the SAME id.
    expect(m.posCreateOrder).toHaveBeenCalledTimes(1)
    expect(m.posPayOrder).toHaveBeenCalledTimes(2)
    expect(m.posPayOrder).toHaveBeenNthCalledWith(1, 'o1', 'cash', 2000)
    expect(m.posPayOrder).toHaveBeenNthCalledWith(2, 'o1', 'cash', 2000)
  })

  it('creates a NEW order when the ticket is edited after a failed pay', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.posCreateOrder
      .mockResolvedValueOnce({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
      .mockResolvedValue({ id: 'o2', status: 'pending', items: [], total_cents: 3000 })
    m.posPayOrder
      .mockRejectedValueOnce(apiError('fallo temporal', 'INTERNAL', 500))
      .mockResolvedValue({
        orderId: 'o2', status: 'paid', paymentMethod: 'cash', totalCents: 3000, changeCents: 0, registerSessionId: 's1',
      })

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(1))

    // Edit the ticket (bump Café qty) → the created order no longer matches.
    fireEvent.click(screen.getByRole('button', { name: 'Agregar uno de Café' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    // A brand-new order is created (create called twice), then paid.
    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(2))
    expect(m.posPayOrder).toHaveBeenLastCalledWith('o2', 'cash', 3000)
  })

  it('creates a NEW order carrying the edited note after a failed pay', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.posCreateOrder
      .mockResolvedValueOnce({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
      .mockResolvedValue({ id: 'o2', status: 'pending', items: [], total_cents: 1500 })
    m.posPayOrder
      .mockRejectedValueOnce(apiError('fallo temporal', 'INTERNAL', 500))
      .mockResolvedValue({
        orderId: 'o2', status: 'paid', paymentMethod: 'cash', totalCents: 1500, changeCents: 500, registerSessionId: 's1',
      })

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(1))

    // Edit the NOTE (not the ticket) → the created order no longer matches, so the
    // next Cobrar must create a FRESH order carrying the edited note — not re-pay
    // the stale order that was created without it.
    fireEvent.change(screen.getByLabelText('Nota (opcional)'), { target: { value: 'para llevar' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    // A brand-new order is created (create called twice), carrying the edited note.
    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(2))
    expect(m.posCreateOrder).toHaveBeenLastCalledWith(
      'store-1', [{ menuItemId: 'm1', quantity: 1 }], 'para llevar', expect.any(String),
    )
    expect(m.posPayOrder).toHaveBeenLastCalledWith('o2', 'cash', 2000)
  })

  it('clears the ticket and pending state after a successful sale', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.posCreateOrder
      .mockResolvedValueOnce({ id: 'o1', status: 'pending', items: [], total_cents: 1500 })
      .mockResolvedValue({ id: 'o2', status: 'pending', items: [], total_cents: 1500 })
    m.posPayOrder.mockResolvedValue({
      orderId: 'o1', status: 'paid', paymentMethod: 'cash', totalCents: 1500, changeCents: 500, registerSessionId: 's1',
    })

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    expect(await screen.findByText(/Vuelto:\s*\$5\.00/)).toBeInTheDocument()
    // Ticket cleared on success.
    expect(screen.getByText('El ticket está vacío.')).toBeInTheDocument()

    // A new sale creates a FRESH order (pending state was cleared, not reused).
    fireEvent.click(screen.getByRole('button', { name: /Café/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))

    await waitFor(() => expect(m.posCreateOrder).toHaveBeenCalledTimes(2))
  })
})

describe('CajaPage — empty states', () => {
  it('renders the pick-a-store guard when no store is selected', async () => {
    mockedUseProfile.mockReturnValue({
      ...PROFILE_CTX,
      activeProfile: { ...PROFILE_CTX.activeProfile, store_id: null },
    } as unknown as ReturnType<typeof useProfile>)

    render(<CajaPage />)

    // No store → the whole page short-circuits to the guard (no crash, no panels).
    expect(await screen.findByText(/Seleccioná un comercio/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cobrar' })).not.toBeInTheDocument()
  })

  it('renders the empty-catalog guard in the Vender panel when the menu is empty', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.getMenu.mockResolvedValue([])

    render(<CajaPage />)

    // Catalog resolved empty → the Vender panel shows its no-products guard.
    expect(await screen.findByText(/No hay productos disponibles/)).toBeInTheDocument()
  })
})

describe('CajaPage — close the caja', () => {
  it('renders the Z report with the over/short figure', async () => {
    m.registerCurrent.mockResolvedValue(OPEN_CURRENT)
    m.registerClose.mockResolvedValue({
      sessionId: 's1', openingFloatCents: 10000, cashSalesCents: 20000, cashInCents: 0, cashOutCents: 0,
      expectedCashCents: 30000, countedCashCents: 29500, overShortCents: -500, orderCount: 4,
    })

    render(<CajaPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar caja' }))
    fireEvent.change(await screen.findByLabelText('Efectivo contado'), { target: { value: '295' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

    await waitFor(() => expect(m.registerClose).toHaveBeenCalledWith('store-1', 29500))
    // Z report visible with the shortage.
    expect(await screen.findByText(/Cierre de caja/)).toBeInTheDocument()
    expect(screen.getByText(/Faltante/)).toBeInTheDocument()
    expect(screen.getByText(/\$5\.00/)).toBeInTheDocument()
  })
})
