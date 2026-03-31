'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePlayerStore, Song } from '@/store/playerStore'
import { Play, Search, X, Music2, MoreVertical, Plus, Trash2, ChevronLeft } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export default function PlaylistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setQueue, currentIndex, queue, isPlaying, togglePlay, playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist } = usePlayerStore()

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [menuSongId, setMenuSongId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (session) fetchSongs()
  }, [session])

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

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return
    createPlaylist(newPlaylistName.trim())
    setNewPlaylistName('')
    setShowCreateModal(false)
  }

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text-muted)' }}>Carregando...</div>
    </div>
  )

  const currentSong = queue[currentIndex]

  // ACTIVE PLAYLIST VIEW
  if (selectedPlaylistId) {
    const playlist = playlists.find(p => p.id === selectedPlaylistId)
    if (!playlist) {
      setSelectedPlaylistId(null)
      return null
    }

    const playlistSongs = playlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[]
    const filteredSongs = playlistSongs.filter(s => {
      const q = search.toLowerCase()
      if (!q) return true
      return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    })

    return (
      <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="layout-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header className="mobile-header-padding" style={{ padding: '24px 40px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSelectedPlaylistId(null)} style={{ background: 'var(--bg-3)', border: 'none', color: 'var(--text)', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
            <div className="lib-search" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', borderRadius: '100px', padding: '10px 16px', width: '380px', maxWidth: '100%' }}>
              <Search size={16} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nesta playlist..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', width: '100%' }} />
              {search && <button onClick={() => setSearch('')}><X size={14} color="var(--text-muted)" /></button>}
            </div>
          </header>

          <main className="mobile-content-padding" style={{ padding: '0 40px 40px', flex: 1, maxWidth: '1400px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px' }}>
              <div style={{ width: '160px', height: '160px', background: 'var(--bg-3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                {filteredSongs[0]?.coverUrl ? (
                  <img src={filteredSongs[0].coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                ) : (
                  <Music2 size={64} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Playlist Pública</span>
                <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '8px 0', letterSpacing: '-1px' }}>{playlist.name}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {filteredSongs.length} {filteredSongs.length === 1 ? 'música' : 'músicas'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              {filteredSongs.length > 0 && (
                <button
                  onClick={() => setQueue(filteredSongs, 0)}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Play size={24} fill="#000" style={{ marginLeft: '4px' }} />
                </button>
              )}
            </div>

            {/* Song list */}
            {filteredSongs.length === 0 ? (
              <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                Nenhuma música encontrada nesta playlist.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSongs.map((song, idx) => {
                  const isActive = currentSong?.id === song.id
                  return (
                    <div
                      key={song.id}
                      onClick={() => setQueue(filteredSongs, idx)}
                      className="library-song-row"
                      style={{
                        display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '12px',
                        background: isActive ? 'var(--bg-3)' : 'transparent', cursor: 'pointer', gap: '16px'
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-2)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-4)', borderRadius: '6px', overflow: 'hidden' }}>
                        {song.coverUrl ? <img src={song.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music2 size={16} color="var(--text-muted)" /></div>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '15px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : 'var(--text)' }}>{song.title}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{song.artist}</span>
                      </div>

                      <div style={{ width: '50px', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {fmt(song.duration)}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setMenuSongId(menuSongId === song.id ? null : song.id) }} style={{ color: 'var(--text-muted)', padding: '4px', background: 'none' }}>
                          <MoreVertical size={16} />
                        </button>
                        {menuSongId === song.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <button onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(playlist.id, song.id); setMenuSongId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', borderRadius: '4px', cursor: 'pointer' }}>
                              <Trash2 size={14} /> Remover da Playlist
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // ALL PLAYLISTS VIEW
  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="layout-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="mobile-header-padding" style={{ padding: '24px 40px', background: 'var(--bg)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Playlists</h1>
        </header>

        <main className="mobile-content-padding" style={{ padding: '0 40px 40px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            {/* Create Button Card */}
            <div 
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'var(--bg-2)', borderRadius: '12px', padding: '20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '1px dashed var(--border)', transition: 'all 0.2s', minHeight: '260px'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Plus size={24} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Criar Playlist</span>
            </div>

            {/* Playlists */}
            {playlists.map(playlist => {
              const coverUrl = playlist.songIds.map(id => songs.find(s => s.id === id)).find(s => s?.coverUrl)?.coverUrl
              return (
                <div
                  key={playlist.id}
                  style={{
                    background: 'var(--bg-2)', borderRadius: '12px', padding: '20px',
                    display: 'flex', flexDirection: 'column', cursor: 'pointer',
                    transition: 'background 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                >
                  <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg-4)', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    {coverUrl ? <img src={coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music2 size={48} color="var(--text-muted)" />}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{playlist.songIds.length} músicas</p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir playlist "${playlist.name}"?`)) deletePlaylist(playlist.id) }}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Nova Playlist</h3>
            <input 
              autoFocus value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da playlist"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', marginBottom: '24px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleCreate} disabled={!newPlaylistName.trim()} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: newPlaylistName.trim() ? 1 : 0.5 }}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
