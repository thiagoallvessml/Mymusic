'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePlayerStore, Song } from '@/store/playerStore'
import Player from '@/components/player/Player'
import {
  Play, Pause, Upload, Search, LogOut, Music2,
  Clock, MoreVertical, Plus, Heart, X, CheckCircle2, Menu, Crown, ArrowUpRight
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AddMusicModal } from '@/components/library/AddMusicModal'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { playSong, setQueue, currentIndex, queue, isPlaying, togglePlay } = usePlayerStore()

  const [songs, setSongs] = useState<Song[]>([])
  const [filtered, setFiltered] = useState<Song[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const userPlan = (session?.user as any)?.plan || 'FREE'
  const planLimit = userPlan === 'ADVANCED' ? Infinity : userPlan === 'INTERMEDIATE' ? 500 : userPlan === 'BASIC' ? 100 : 2
  const isAtLimit = songs.length >= planLimit

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (session) fetchSongs()
  }, [session])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? songs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album || '').toLowerCase().includes(q)
    ) : songs)
  }, [search, songs])

  async function fetchSongs() {
    setLoading(true)
    try {
      const res = await fetch('/api/songs')
      if (res.ok) {
        const data = await res.json()
        setSongs(data)
      }
    } finally {
      setLoading(false)
    }
  }

  function playAll() {
    if (filtered.length > 0) setQueue(filtered, 0)
  }

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text-muted)' }}>Carregando...</div>
    </div>
  )

  const currentSong = queue[currentIndex]

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="layout-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header className="mobile-header-padding" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 40px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ color: 'var(--text)', display: 'none' }}
              className="mobile-hamburger"
            >
              <Menu size={24} />
            </button>
            <div className="lib-search" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-3)', opacity: 0.8, borderRadius: '100px',
              padding: '10px 16px', width: '380px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '100%'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar músicas..."
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', fontSize: '13px', width: '100%'
                }}
              />
              {search && <button onClick={() => setSearch('')}><X size={14} color="var(--text-muted)" /></button>}
            </div>
          </div>
          <div></div>
        </header>

        <main className="mobile-content-padding" style={{ padding: '0 40px 40px 40px', flex: 1, maxWidth: '1400px' }}>
          {/* Actions bar */}
        <div className="lib-actions-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <h1 className="lib-title" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Sua Biblioteca</h1>
              <span className="lib-subtitle" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {songs.length} / {planLimit === Infinity ? '∞' : planLimit} {songs.length === 1 ? 'música' : 'músicas'}
              </span>
            </div>
          </div>
          <div className="lib-buttons" style={{ display: 'flex', gap: '8px' }}>
            {filtered.length > 0 && (
              <button
                onClick={playAll}
                className="lib-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', background: 'var(--accent)', color: '#000',
                  borderRadius: '100px', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s'
                }}
              >
                <Play size={16} fill="#000" /> Tocar tudo
              </button>
            )}
            <button
              onClick={() => {
                if (isAtLimit) {
                  alert(`Você atingiu o limite de ${planLimit} músicas do plano ${userPlan}. Faça upgrade em Planos para continuar.`)
                  return
                }
                setShowUpload(true)
              }}
              className="lib-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', background: isAtLimit ? 'var(--bg-4)' : 'var(--bg-3)', color: isAtLimit ? 'var(--text-muted)' : 'var(--text)',
                borderRadius: '100px', fontWeight: 600, fontSize: '14px',
                border: '1px solid var(--border)', transition: 'background 0.2s',
                cursor: isAtLimit ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>
        </div>

        {/* Plan Limit Banner */}
        {isAtLimit && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px', marginBottom: '24px'
          }}>
            <Crown size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
              Você atingiu o limite de <strong>{planLimit} músicas</strong> do plano <strong>{userPlan}</strong>.
            </p>
            <a href="/plans" style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px',
              background: 'var(--accent)', color: '#000', borderRadius: '100px',
              fontWeight: 700, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap'
            }}>
              Upgrade <ArrowUpRight size={14} />
            </a>
          </div>
        )}

        <AddMusicModal isOpen={showUpload} onClose={() => setShowUpload(false)} onSuccess={fetchSongs} />

        {/* Song list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            Carregando biblioteca...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Music2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {search ? 'Nenhum resultado encontrado' : 'Sua biblioteca está vazia'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {search ? 'Tente buscar por outro termo' : 'Faça upload de suas músicas para começar'}
            </p>
            {!search && (
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  padding: '12px 24px', background: 'var(--accent)', color: '#000',
                  borderRadius: '100px', fontWeight: 700, fontSize: '14px'
                }}
              >
                Adicionar música
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((song, idx) => {
                const isActive = currentSong?.id === song.id
                return (
                  <div
                    key={song.id}
                    onClick={() => { setQueue(filtered, idx) }}
                    className="library-song-row"
                    style={{
                      display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '12px',
                      background: isActive ? 'var(--bg-3)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s ease', gap: '16px',
                      border: '1px solid', borderColor: isActive ? 'var(--border)' : 'transparent'
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    {/* Cover Art / Play Overlay */}
                    <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-4)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {song.coverUrl ? (
                        <img src={song.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music2 size={20} color="var(--text-muted)" />
                      )}
                      
                      {/* Hover Overlay */}
                      <div className={`song-overlay ${isActive ? 'active' : ''}`} style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.2s'
                      }}>
                        {isActive && isPlaying ? <Pause size={20} fill="#fff" color="#fff" /> : <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />}
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p className="song-meta-title" style={{ fontSize: '15px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.title}
                      </p>
                      <p className="song-meta-artist" style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.artist}
                      </p>
                    </div>

                    {/* Album */}
                    <div className="hide-on-mobile" style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.album || '—'}
                      </p>
                    </div>

                    {/* Duration */}
                    <div style={{ width: '60px', textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{fmt(song.duration)}</span>
                    </div>

                    {/* Actions */}
                    <div className="hide-on-mobile" style={{ width: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(song.id); }}
                        style={{ color: favorites.has(song.id) ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s' }}
                      >
                        <Heart size={18} fill={favorites.has(song.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
      </div>
      
      {/* Dynamic CSS injection via generic style tag inside JSX for simple classes that need dynamic display block overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .library-song-row .song-overlay {
          opacity: 0;
        }
        .library-song-row:hover .song-overlay {
          opacity: 1 !important;
        }
        .library-song-row .song-overlay.active {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .lib-search {
            padding: 7px 12px !important;
            width: 100% !important;
          }
          .lib-search input {
            font-size: 12px !important;
          }
          .lib-actions-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .lib-buttons {
            width: 100% !important;
          }
          .lib-title {
            font-size: 20px !important;
          }
          .lib-subtitle {
            font-size: 12px !important;
          }
          .lib-btn {
            padding: 7px 14px !important;
            font-size: 12px !important;
            gap: 4px !important;
          }
          .lib-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
          .library-song-row {
            padding: 10px 12px !important;
          }
          .song-meta-title,
          .song-meta-artist {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            word-break: break-word;
          }
          .mobile-hamburger { display: block !important; }
          .hide-on-mobile { display: none !important; }
          .sidebar-mobile-close { display: block !important; }
        }
      `}} />
    </div>
  )
}
