import type { Metadata } from 'next'
import './globals.css'
import { MSWProvider } from '@/components/MSWProvider'
import { I18nProvider } from '@/i18n'

export const metadata: Metadata = {
  title: {
    default: 'Runbits — Plataforma de Delivery para Comercios',
    template: '%s | Runbits',
  },
  description:
    'Runbits conecta tu comercio con más clientes a través de nuestra plataforma de delivery. Gestioná pedidos, menú y entregas desde un solo lugar.',
  metadataBase: new URL('https://runbits.io'),
  openGraph: {
    title: 'Runbits — Plataforma de Delivery para Comercios',
    description:
      'Conectá tu negocio con más clientes. Gestión de pedidos, menú y entregas en una sola plataforma.',
    url: 'https://runbits.io',
    siteName: 'Runbits',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Runbits — Plataforma de Delivery',
    description:
      'Conectá tu negocio con más clientes a través de nuestra plataforma de delivery.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <I18nProvider>
          <MSWProvider>
            {children}
          </MSWProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
