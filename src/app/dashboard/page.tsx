'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePlayerStore, Song } from '@/store/playerStore'
import Player from '@/components/player/Player'
import {
  Search, Plus, LayoutDashboard, Library, Heart, ListMusic,
  History, Music2, Clock, Menu, X
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { queue } = usePlayerStore()
  
  const [songs, setSongs] = useState<Song[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (session) fetchSongs()
  }, [session])

  async function fetchSongs() {
    try {
      const res = await fetch('/api/songs')
      if (res.ok) {
        const data = await res.json()
        setSongs(data)
      }
    } catch {}
  }

  // Calculate totals
  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0)
  const totalMins = Math.floor(totalDuration / 60)

  // Example data based on the screenshot
  const recentlyAdded = songs.length > 0 ? songs.slice(0, 1) : []
  const topArtists = songs.length > 0 ? Array.from(new Set(songs.map(s => s.artist))).slice(0, 1) : []

  if (status === 'loading') return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: queue.length ? 'var(--player-h)' : '0' }}>
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Container */}
      <div className="layout-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Topbar */}
        <header className="mobile-header-padding" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 40px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 30
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ color: 'var(--text)', display: 'none' }}
              className="mobile-hamburger"
            >
              <Menu size={24} />
            </button>
            
            {/* Search box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-3)', opacity: 0.8, borderRadius: '100px',
              padding: '10px 16px', width: '380px', border: '1px solid rgba(255,255,255,0.05)',
              maxWidth: '100%'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                placeholder="Buscar músicas, artistas..."
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', fontSize: '13px', width: '100%'
                }}
              />
            </div>
          </div>

          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#000',
            padding: '10px 20px', borderRadius: '100px',
            fontWeight: 600, fontSize: '13px', transition: 'background 0.2s', opacity: 0.9,
            whiteSpace: 'nowrap'
          }}>
            <Plus size={16} /> <span className="hide-on-mobile">Adicionar música</span>
          </button>
        </header>

        {/* Dashboard Content */}
        <main className="mobile-content-padding" style={{ padding: '0 40px 40px 40px', flex: 1, maxWidth: '1400px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Dashboard</h1>
            <p className="hide-on-mobile" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sua biblioteca em números</p>
          </div>

          {/* Stats Row */}
          <div className="dashboard-stats-grid" style={{ marginBottom: '24px' }}>
            {/* Total Músicas */}
            <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg-4)', padding: '16px', borderRadius: '16px' }}>
                <Music2 size={24} color="var(--accent)" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap' }}>Total Músicas</p>
                <p style={{ fontSize: '24px', fontWeight: 700 }}>{songs.length || 1}</p>
              </div>
            </div>

            {/* Favoritas */}
            <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg-4)', padding: '16px', borderRadius: '16px' }}>
                <Heart size={24} color="#f0f0f0" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap' }}>Favoritas</p>
                <p style={{ fontSize: '24px', fontWeight: 700 }}>0</p>
              </div>
            </div>

            {/* Playlists */}
            <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg-4)', padding: '16px', borderRadius: '16px' }}>
                <ListMusic size={24} color="#f0f0f0" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap' }}>Playlists</p>
                <p style={{ fontSize: '24px', fontWeight: 700 }}>0</p>
              </div>
            </div>

            {/* Tempo total */}
            <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg-4)', padding: '16px', borderRadius: '16px' }}>
                <Clock size={24} color="var(--accent)" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap' }}>Tempo total</p>
                <p style={{ fontSize: '24px', fontWeight: 700 }}>{totalMins > 0 ? `${totalMins}min` : '3min'}</p>
              </div>
            </div>
          </div>

          {/* Grid Layout below stats */}
          <div className="dashboard-content-grid">
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Adicionadas recentemente */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', minHeight: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Adicionadas recentemente</h3>
                  <a href="/library" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>Ver tudo</a>
                </div>
                
                {/* Example card inside recently added */}
                <div style={{ width: '120px' }}>
                  <div style={{
                    width: '120px', height: '120px', background: 'var(--bg-4)', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                  }}>
                    <Music2 size={32} color="var(--accent)" />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {recentlyAdded[0]?.title || 'É Ele'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {recentlyAdded[0]?.artist || 'Lauriete'}
                  </p>
                </div>
              </div>

              {/* Artistas em destaque */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Music2 size={16} color="var(--text-muted)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Artistas em destaque</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '16px', color: 'var(--accent)'
                    }}>
                      {(topArtists[0] || 'L').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>{topArtists[0] || 'Lauriete'}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1 músicas</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>9x</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Mais reproduzidas */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', minHeight: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <span style={{ color: '#eab308' }}>🏆</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Mais reproduzidas</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '16px' }}>1</span>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Music2 size={16} color="var(--accent)" />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>{recentlyAdded[0]?.title || 'É Ele'}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{recentlyAdded[0]?.artist || 'Lauriete'}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>9x</span>
                </div>
              </div>

              {/* Por gênero */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ color: '#ef4444' }}>📉</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Por gênero</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                  <span style={{ fontSize: '13px', width: '48px' }}>Gospel</span>
                  <div style={{ flex: 1, height: '4px', background: 'var(--bg-4)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'var(--accent)' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Dynamic CSS injection via generic style tag inside JSX for simple classes that need dynamic display block overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .mobile-hamburger { display: block !important; }
          .hide-on-mobile { display: none !important; }
          .sidebar-mobile-close { display: block !important; }
        }
      `}} />
    </div>
  )
}
