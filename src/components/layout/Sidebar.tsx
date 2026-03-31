'use client'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Library, Heart, ListMusic,
  History, Music2, X, Settings2
} from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'

export function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { data: session } = useSession()
  const { queue } = usePlayerStore()
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 35,
          opacity: isOpen ? 1 : 0, 
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s'
        }}
      />
      
      {/* Sidebar Content */}
      <aside className={`layout-sidebar ${isOpen ? 'open' : ''}`} style={{
        background: 'var(--bg-2)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: queue.length ? 'var(--player-h)' : '0',
        left: 0, zIndex: 40
      }}>
        {/* close button */}
        <button 
          onClick={onClose} 
          className="sidebar-mobile-close d-md-none"
          style={{ position: 'absolute', right: '16px', top: '24px', color: 'var(--text-muted)', display: 'none' }}
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
            <Music2 size={20} color="#000" />
          </div>
          <span className="sidebar-text" style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px' }}>MyMusic2</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/dashboard" className={`sidebar-nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span className="sidebar-text">Dashboard</span>
          </a>
          <a href="/library" className={`sidebar-nav-link ${pathname === '/library' ? 'active' : ''}`}>
            <Library size={20} />
            <span className="sidebar-text">Biblioteca</span>
          </a>
          <a href="#" className={`sidebar-nav-link ${pathname === '/favoritos' ? 'active' : ''}`}>
            <Heart size={20} />
            <span className="sidebar-text">Favoritos</span>
          </a>
          <a href="#" className="sidebar-nav-link">
            <ListMusic size={20} />
            <span className="sidebar-text">Playlists</span>
          </a>
          <a href="#" className="sidebar-nav-link">
            <History size={20} />
            <span className="sidebar-text">Histórico</span>
          </a>
          <a href="/studio" className={`sidebar-nav-link ${pathname === '/studio' ? 'active' : ''}`}>
            <Settings2 size={20} />
            <span className="sidebar-text">Estúdio</span>
          </a>
          <a href="/church" className={`sidebar-nav-link ${pathname === '/church' ? 'active' : ''}`} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <Music2 size={20} color="var(--accent3)" />
            <span className="sidebar-text">Modo Igreja</span>
          </a>
        </nav>

        {/* User Profile */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-3)', padding: '16px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => signOut()}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '16px'
            }}>
              {session?.user?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.user?.name || 'thiago'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Conta pessoal</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
