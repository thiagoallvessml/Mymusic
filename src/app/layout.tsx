import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { GlobalPlayer } from '@/components/layout/GlobalPlayer'

export const metadata: Metadata = {
  title: 'MyMusic — Sua Biblioteca Pessoal',
  description: 'Sua biblioteca de música privada e pessoal. Faça upload, organize e ouça suas músicas favoritas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <GlobalPlayer />
        </Providers>
      </body>
    </html>
  )
}
