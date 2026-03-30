'use client'
import { usePathname } from 'next/navigation'
import Player from '@/components/player/Player'

export function GlobalPlayer() {
  const pathname = usePathname()

  // Do not render player on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return <Player />
}
