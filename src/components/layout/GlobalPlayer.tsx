'use client'
import { usePathname } from 'next/navigation'
import Player from '@/components/player/Player'

export function GlobalPlayer() {
  const pathname = usePathname()

  // Do not render player on auth pages or isolated church page
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/church')) {
    return null
  }

  return <Player />
}
