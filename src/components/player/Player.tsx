'use client'
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, FileEdit, X, Music2, Heart, ListMusic, CheckCircle2
} from 'lucide-react'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export default function Player() {
  const [showLyrics, setShowLyrics] = useState(false)
  const {
    queue, currentIndex, isPlaying, volume, progress,
    shuffle, repeat, togglePlay, next, prev,
    setVolume, setProgress, toggleShuffle, cycleRepeat,
    addToHistory, favorites, toggleFavorite, playlists, addSongToPlaylist
  } = usePlayerStore()

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const song = queue[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !song) return
    audio.src = song.fileUrl
    audio.load()
    addToHistory(song.id) // Adiciona ao histórico
    if (isPlaying) audio.play().catch(() => {})
  }, [song?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    isPlaying ? audio.play().catch(() => {}) : audio.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function onTimeUpdate() {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress(audio.currentTime / audio.duration)
  }

  function onEnded() {
    if (repeat === 'one') { audioRef.current?.play(); return }
    next()
  }

  function seekTo(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const val = parseFloat(e.target.value)
    audio.currentTime = val * audio.duration
    setProgress(val)
  }

  if (!song) return null

  const duration = audioRef.current?.duration || song.duration || 0
  const currentTime = progress * duration

  return (
    <>
      <div className="player-container" style={{
        position: 'relative', width: '100%', height: 'var(--player-h)',
        background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)', zIndex: 100,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '24px'
      }}>
        <audio
          ref={audioRef}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          onCanPlay={() => { if (isPlaying) audioRef.current?.play().catch(() => {}) }}
        />

        {/* Song info */}
        <div className="player-song-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px', flex: 1 }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '6px', flexShrink: 0,
            background: 'var(--bg-4)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', overflow: 'hidden'
          }}>
            {song.coverUrl ? <img src={song.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {song.title}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {song.artist}
            </p>
          </div>
          
          <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <button
              onClick={() => toggleFavorite(song.id)}
              style={{ color: favorites.includes(song.id) ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              title={favorites.includes(song.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
            >
              <Heart size={18} fill={favorites.includes(song.id) ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => {
                if (playlists.length === 0) {
                  alert('Você ainda não tem playlists. Crie uma na página de Playlists primeiro!')
                } else {
                  setPlaylistModalOpen(true)
                }
              }}
              style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Adicionar à Playlist"
            >
              <ListMusic size={18} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="player-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 2, maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="hide-on-mobile" onClick={toggleShuffle} title="Aleatório"
              style={{ color: shuffle ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
              <Shuffle size={16} />
            </button>
            <button onClick={prev} style={{ color: 'var(--text)', transition: 'opacity 0.2s' }}>
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--text)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s', flexShrink: 0
              }}
            >
              {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" />}
            </button>
            <button onClick={next} style={{ color: 'var(--text)' }}>
              <SkipForward size={20} />
            </button>
            <button className="hide-on-mobile" onClick={cycleRepeat} title="Repetir"
              style={{ color: repeat !== 'none' ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
            
            {/* Mobile Lyrics Button inside central controls */}
            <button className="show-on-mobile" onClick={() => setShowLyrics(!showLyrics)} title="Letras"
              style={{ color: showLyrics ? 'var(--accent)' : 'var(--text)', display: 'none', transition: 'color 0.2s' }}>
              📝
            </button>
          </div>

          {/* Progress */}
          <div className="player-progress" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
              {fmt(currentTime)}
            </span>
            <input type="range" min={0} max={1} step={0.001} value={progress} onChange={seekTo}
              style={{ flex: 1, accentColor: 'var(--text)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px' }}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Volume and Extras */}
        <div className="player-extras hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end', maxWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} style={{ color: 'var(--text-muted)' }}>
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              style={{ width: '90px', accentColor: 'var(--text)' }} />
          </div>
          <button onClick={() => setShowLyrics(!showLyrics)} title="Ver Letra"
            style={{ 
              color: showLyrics ? 'var(--accent)' : 'var(--text)', 
              transition: 'all 0.2s ease', 
              display: 'flex', 
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: showLyrics ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showLyrics ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: '100px'
            }}>
            📝 Letra
          </button>
        </div>
      </div>

      {/* Lyrics Sidebar */}
      {showLyrics && (
        <div className="lyrics-sidebar" style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 'var(--player-h)',
          width: '35vw',
          minWidth: '340px',
          maxWidth: '100vw',
          background: 'rgba(20, 20, 20, 0.98)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          zIndex: 90, // below player zIndex 100
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Painel de Letras</h3>
            <button onClick={() => setShowLyrics(false)} style={{ color: '#888', padding: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            {/* Song Card */}
            <div style={{ padding: '32px 32px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '12px', 
                background: '#2a2a2a', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                {song.coverUrl ? <img src={song.coverUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Music2 size={36} color="#a855f7" strokeWidth={1.5} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', lineHeight: '1.2', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</h4>
                <p style={{ fontSize: '15px', color: '#a8a8b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</p>
                {(song.album || song.year) && (
                  <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>{song.album} {song.year ? `• ${song.year}` : ''}</p>
                )}
              </div>
            </div>
            
            <div style={{ margin: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
            
            {/* Lyrics Area */}
            <div style={{ 
              padding: '32px', 
              fontSize: '18px', 
              color: song.lyrics ? '#fff' : '#666', 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.8',
              fontWeight: 600,
              fontFamily: 'var(--font-inter), sans-serif',
              letterSpacing: '-0.02em',
              paddingBottom: '80px'
            }}>
              {song.lyrics || 'Nenhuma letra disponível.'}
            </div>
          </div>
        </div>
      )}

      {/* Global & Responsive CSS for Player */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --player-h: 90px;
        }
        @media (max-width: 768px) {
          :root {
            --player-h: 150px;
          }
          .player-container {
            flex-direction: column !important;
            padding: 12px 16px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
            gap: 12px !important;
            height: auto !important;
            min-height: var(--player-h) !important;
            justify-content: center !important;
          }
          .player-song-info {
            width: 100% !important;
            min-width: 100% !important;
            margin-bottom: 0px !important;
          }
          .player-controls {
            width: 100% !important;
            max-width: 100% !important;
          }
          .player-progress {
            margin-top: -4px !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: block !important;
          }
          .lyrics-sidebar {
            width: 100vw !important;
            min-width: 100vw !important;
            border-left: none !important;
          }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
      
      {/* Add To Playlist Modal */}
      {playlistModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Adicionar à Playlist</h3>
              <button onClick={() => setPlaylistModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Selecione uma playlist para adicionar <strong>{song?.title}</strong>:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              {playlists.map(playlist => {
                const isAdded = song ? playlist.songIds.includes(song.id) : false
                return (
                  <button
                    key={playlist.id}
                    disabled={isAdded}
                    onClick={() => {
                      if (song) addSongToPlaylist(playlist.id, song.id)
                      setPlaylistModalOpen(false)
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
    </>
  )
}
