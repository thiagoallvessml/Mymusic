'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePlayerStore, Song } from '@/store/playerStore'
import Player from '@/components/player/Player'
import {
  Play, Pause, Upload, Search, LogOut, Music2,
  Clock, MoreVertical, Plus, Heart, X, CheckCircle2, Menu, Crown, ArrowUpRight,
  Pencil, Trash2, ListMusic
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AddMusicModal } from '@/components/library/AddMusicModal'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { playSong, setQueue, currentIndex, queue, isPlaying, togglePlay, favorites, toggleFavorite, playlists, addSongToPlaylist } = usePlayerStore()

  const [songs, setSongs] = useState<Song[]>([])
  const [filtered, setFiltered] = useState<Song[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Context menu & edit state
  const [menuSongId, setMenuSongId] = useState<string | null>(null)
  const [editSong, setEditSong] = useState<Song | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Song | null>(null)
  const [playlistModalSong, setPlaylistModalSong] = useState<Song | null>(null)


  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (session) fetchSongs()
  }, [session])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(songs.filter(s => {
      if (!favorites.includes(s.id)) return false
      if (!q) return true
      return s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q)
    }))
  }, [search, songs, favorites])

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



  async function handleRename() {
    if (!editSong || !editTitle.trim()) return
    try {
      const res = await fetch(`/api/songs/${editSong.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), artist: editArtist.trim() })
      })
      if (res.ok) {
        setSongs(prev => prev.map(s => s.id === editSong.id ? { ...s, title: editTitle.trim(), artist: editArtist.trim() } : s))
        setEditSong(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao renomear')
      }
    } catch { alert('Erro de rede') }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      const res = await fetch(`/api/songs/${deleteConfirm.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSongs(prev => prev.filter(s => s.id !== deleteConfirm.id))
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch { alert('Erro de rede') }
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
              <h1 className="lib-title" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Favoritos</h1>
              <span className="lib-subtitle" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {filtered.length} {filtered.length === 1 ? 'música' : 'músicas'}
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
          </div>
        </div>

        {/* Song list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            Carregando biblioteca...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Music2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {search ? 'Nenhum resultado encontrado' : 'Nenhum favorito ainda'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {search ? 'Tente buscar por outro termo' : 'Curta suas músicas clicando no ícone do coração para que elas apareçam aqui.'}
            </p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                        className="hide-on-mobile"
                        style={{ color: favorites.includes(song.id) ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s', padding: '4px' }}
                      >
                        <Heart size={18} fill={favorites.includes(song.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (playlists.length === 0) {
                            alert('Você ainda não tem playlists. Crie uma na página de Playlists primeiro!')
                          } else {
                            setPlaylistModalSong(song)
                          }
                        }}
                        className="hide-on-mobile"
                        style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: '4px' }}
                        title="Adicionar à Playlist"
                      >
                        <ListMusic size={18} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuSongId(menuSongId === song.id ? null : song.id) }}
                          style={{ color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {menuSongId === song.id && (
                          <div 
                            style={{
                              position: 'absolute', right: 0, top: '100%', zIndex: 50,
                              background: 'var(--bg-2)', border: '1px solid var(--border)',
                              borderRadius: '8px', minWidth: '160px', padding: '4px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setEditSong(song)
                                setEditTitle(song.title)
                                setEditArtist(song.artist)
                                setMenuSongId(null)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                padding: '10px 12px', background: 'transparent', color: 'var(--text)',
                                border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Pencil size={15} /> Renomear
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm(song)
                                setMenuSongId(null)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                padding: '10px 12px', background: 'transparent', color: '#ef4444',
                                border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={15} /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
      </div>

      {/* Click-away listener for context menu */}
      {menuSongId && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
          onClick={() => setMenuSongId(null)} 
        />
      )}

      {/* Rename Modal */}
      {editSong && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', padding: '28px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Renomear Música</h3>
            
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Título</label>
            <input 
              value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
              style={{ width: '100%', padding: '12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
            />
            
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Artista</label>
            <input 
              value={editArtist} onChange={e => setEditArtist(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '24px', outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setEditSong(null)}
                style={{ flex: 1, padding: '12px', background: 'var(--bg-3)', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleRename}
                style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', padding: '28px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#ef4444' }}>Excluir Música</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
              Tem certeza que deseja excluir:
            </p>
            <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '24px' }}>
              "{deleteConfirm.title}" — {deleteConfirm.artist}
            </p>
            <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '24px' }}>
              Esta ação não pode ser desfeita.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '12px', background: 'var(--bg-3)', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add To Playlist Modal */}
      {playlistModalSong && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Adicionar à Playlist</h3>
              <button onClick={() => setPlaylistModalSong(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Selecione uma playlist para adicionar <strong>{playlistModalSong.title}</strong>:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              {playlists.map(playlist => {
                const isAdded = playlist.songIds.includes(playlistModalSong.id)
                return (
                  <button
                    key={playlist.id}
                    disabled={isAdded}
                    onClick={() => {
                      addSongToPlaylist(playlist.id, playlistModalSong.id)
                      setPlaylistModalSong(null)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      padding: '16px', background: 'var(--bg-3)', border: '1px solid var(--border)',
                      borderRadius: '12px', color: isAdded ? 'var(--text-muted)' : 'var(--text)',
                      cursor: isAdded ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                      opacity: isAdded ? 0.7 : 1
                    }}
                    onMouseEnter={e => { if (!isAdded) e.currentTarget.style.background = 'var(--bg-4)' }}
                    onMouseLeave={e => { if (!isAdded) e.currentTarget.style.background = 'var(--bg-3)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ListMusic size={18} color={isAdded ? "var(--text-muted)" : "var(--accent)"} />
                      <span style={{ fontWeight: 600 }}>{playlist.name}</span>
                    </div>
                    {isAdded && <CheckCircle2 size={16} color="var(--text-muted)" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
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
