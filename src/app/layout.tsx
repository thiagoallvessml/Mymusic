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
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden', background: 'var(--bg)' }}>
            <div id="app-scroll-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
              {children}
            </div>
            <div style={{ flexShrink: 0, zIndex: 100 }}>
              <GlobalPlayer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
