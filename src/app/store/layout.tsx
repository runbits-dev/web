import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pedí online — Runbits',
  description: 'Hacé tu pedido online. Menú digital, seguimiento en tiempo real, y múltiples medios de pago. Powered by Runbits.',
  openGraph: {
    title: 'Pedí online — Runbits',
    description: 'Menú digital con pedidos online. Powered by Runbits — la plataforma que pone al comercio primero.',
    siteName: 'Runbits',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
