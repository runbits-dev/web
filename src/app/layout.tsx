import type { Metadata } from 'next'
import './globals.css'
import { MSWProvider } from '@/components/MSWProvider'

export const metadata: Metadata = {
  title: 'runbits',
  description: 'Panel de gestión runbits',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <MSWProvider>
          {children}
        </MSWProvider>
      </body>
    </html>
  )
}
