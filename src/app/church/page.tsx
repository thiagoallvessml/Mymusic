'use client'
import React, { useEffect, useState, useRef } from 'react'
import { signOut } from 'next-auth/react'

type Song = {
  id: string
  title?: string
  artist?: string
  album?: string
  coverUrl?: string
  fileUrl?: string
  lyrics?: string
  is_favorite?: boolean
}

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ChurchPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filtered, setFiltered] = useState<Song[]>([])
  const [search, setSearch] = useState('')
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [prevVol, setPrevVol] = useState(0.8)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const [isMobile, setIsMobile] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 680)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setSongs(data)
        setFiltered(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim().toLowerCase()
      if (!q) {
        setFiltered(songs)
      } else {
        setFiltered(songs.filter(s => 
          (s.title || '').toLowerCase().includes(q) ||
          (s.artist || '').toLowerCase().includes(q) ||
          (s.album || '').toLowerCase().includes(q)
        ))
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [search, songs])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const currentSong = currentIndex >= 0 && currentIndex < songs.length ? songs[currentIndex] : null

  const playSong = (index: number) => {
    if (index < 0 || index >= songs.length) return
    setCurrentIndex(index)
    setIsPlaying(true)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }, 50)
    fetch(`/api/songs/${songs[index].id}/play`, { method: 'POST' }).catch(() => {})
  }

  const togglePlay = () => {
    if (!currentSong) return
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(console.error)
      }
    }
  }

  const nextSong = () => {
    if (!songs.length) return
    if (shuffle) {
      let r = 0
      do { r = Math.floor(Math.random() * songs.length) } while (r === currentIndex && songs.length > 1)
      playSong(r)
    } else {
      playSong((currentIndex + 1) % songs.length)
    }
  }

  const prevSong = () => {
    if (!songs.length) return
    playSong(currentIndex <= 0 ? songs.length - 1 : currentIndex - 1)
  }

  const toggleMute = () => {
    if (muted) {
      setVolume(prevVol || 0.8)
      setMuted(false)
    } else {
      setPrevVol(volume)
      setVolume(0)
      setMuted(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audioRef.current && duration) {
      audioRef.current.currentTime = pct * duration
      setCurrentTime(pct * duration)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.ctrlKey && e.key === 'ArrowRight') nextSong()
      if (e.ctrlKey && e.key === 'ArrowLeft') prevSong()
      if (e.key === 'm' || e.key === 'M') toggleMute()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isPlaying, currentSong, shuffle, currentIndex, songs.length, muted])

  const getVolIcon = () => {
    if (muted || volume === 0) return '🔇'
    if (volume < 0.5) return '🔉'
    return '🔊'
  }

  return (
    <div className="church-wrapper">
      <style>{`
        .church-wrapper {
          --bg:      #131313;
          --bg2:     #201F1F;
          --bg3:     #2A2A2A;
          --border:  rgba(255,255,255,0.08);
          --accent:  #7c3aed;
          --accent2: #a855f7;
          --accent3: #c084fc;
          --text:    #f1f5f9;
          --text2:   #94a3b8;
          --text3:   #64748b;
          --glow:    rgba(124,58,237,0.35);
          --player-h: 88px;

          height: 100vh;
          width: 100vw;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: fixed;
          top: 0; left: 0; z-index: 9999;
        }

        .ch-header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 12px 24px; background: var(--bg2); border-bottom: 1px solid var(--border);
          flex-shrink: 0; height: 60px;
        }
        .ch-logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ch-logo-icon {
          width: 34px; height: 34px; background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 9px; display: flex; align-items: center; justify-content: center;
          font-size: 16px; box-shadow: 0 0 12px var(--glow);
        }
        .ch-logo-text { font-size: 16px; font-weight: 800; background: linear-gradient(135deg, var(--accent3), var(--text)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ch-search-wrap { position: relative; flex: 1; max-width: 520px; }
        .ch-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; pointer-events: none; }
        .ch-search-input {
          width: 100%; padding: 9px 14px 9px 40px; background: var(--bg3); border: 1px solid var(--border);
          border-radius: 10px; color: var(--text); font-size: 14px; font-family: inherit; outline: none; transition: all 0.2s;
        }
        .ch-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .ch-search-input::placeholder { color: var(--text3); }
        .ch-logout-btn { background: none; border: none; color: var(--text3); font-size: 18px; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .ch-logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        .ch-song-list { flex: 1; overflow-y: auto; padding: 12px 20px; padding-bottom: calc(var(--player-h) + 8px); }
        .ch-song-count { font-size: 12px; color: var(--text3); margin-bottom: 10px; padding: 0 2px; }
        .ch-song-row {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; cursor: pointer;
          transition: background 0.15s; border: 1px solid transparent;
        }
        .ch-song-row:hover { background: var(--bg2); }
        .ch-song-row.playing { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.25); }
        .ch-song-thumb {
          width: 46px; height: 46px; border-radius: 8px; background: var(--bg3);
          display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; overflow: hidden;
        }
        .ch-song-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ch-song-info { flex: 1; overflow: hidden; }
        .ch-song-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ch-song-meta { font-size: 12px; color: var(--text3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ch-song-fav { font-size: 13px; color: #f43f5e; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .ch-song-row.fav .ch-song-fav { opacity: 1; }
        .ch-song-play-icon { font-size: 13px; color: var(--accent3); flex-shrink: 0; opacity: 0; transition: opacity 0.2s; }
        .ch-song-row:hover .ch-song-play-icon { opacity: 1; }
        .ch-song-row.playing .ch-song-play-icon { opacity: 1; }
        
        .ch-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 12px; color: var(--text3); }
        .ch-empty-icon { font-size: 48px; }
        .ch-empty h3 { font-size: 16px; font-weight: 600; color: var(--text2); }
        .ch-empty p { font-size: 13px; }

        .ch-player {
          position: fixed; bottom: 0; left: 0; right: 0; height: var(--player-h);
          background: var(--bg2); border-top: 1px solid var(--border); display: flex; align-items: center; gap: 16px; padding: 0 20px;
        }
        .ch-player-info { display: flex; align-items: center; gap: 12px; min-width: 200px; max-width: 260px; flex: 0 0 auto; }
        .ch-player-cover {
          width: 52px; height: 52px; border-radius: 10px; background: var(--bg3); display: flex; align-items: center;
          justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .ch-player-cover img { width: 100%; height: 100%; object-fit: cover; }
        .ch-player-meta { overflow: hidden; }
        .ch-player-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ch-player-artist { font-size: 11px; color: var(--text3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .ch-player-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .ch-player-controls { display: flex; align-items: center; gap: 4px; }
        .ch-ctrl-btn {
          width: 34px; height: 34px; background: none; border: none; color: var(--text2); font-size: 15px;
          cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .ch-ctrl-btn:hover { background: var(--bg3); color: var(--text); }
        .ch-ctrl-btn.active { color: var(--accent3); }
        .ch-play-btn {
          width: 44px; height: 44px; font-size: 18px; background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white; box-shadow: 0 4px 12px var(--glow);
        }
        .ch-play-btn:hover { transform: scale(1.07); background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; }

        .ch-progress-wrap { display: flex; align-items: center; gap: 8px; width: 100%; max-width: 480px; }
        .ch-time { font-size: 11px; color: var(--text3); min-width: 32px; }
        .ch-time.right { text-align: right; }
        .ch-progress-bar { flex: 1; height: 4px; background: var(--bg3); border-radius: 2px; cursor: pointer; position: relative; transition: height 0.15s; }
        .ch-progress-bar:hover { height: 6px; }
        .ch-progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); width: 0%; position: relative; }
        .ch-progress-thumb {
          position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: white;
          opacity: 0; transition: opacity 0.15s;
        }
        .ch-progress-bar:hover .ch-progress-thumb { opacity: 1; }

        .ch-player-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ch-vol-icon { font-size: 16px; cursor: pointer; color: var(--text2); transition: color 0.2s; flex-shrink: 0; }
        .ch-vol-icon:hover { color: var(--text); }
        .ch-vol-slider { width: 80px; height: 4px; -webkit-appearance: none; appearance: none; background: var(--bg3); border-radius: 2px; outline: none; cursor: pointer; }
        .ch-vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--accent2); cursor: pointer; }
        .ch-lyrics-btn { font-size: 18px; transition: color 0.2s; }

        .ch-lyrics-panel {
          position: fixed; top: 0; right: 0; bottom: 0; width: 340px; max-width: 100vw;
          background: var(--bg2); border-left: 1px solid var(--border); display: flex; flex-direction: column;
          transform: translateX(100%); transition: transform 0.3s ease; z-index: 200;
        }
        .ch-lyrics-panel.open { transform: translateX(0); }
        .ch-lyrics-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .ch-lyrics-header h3 { font-size: 15px; font-weight: 700; }
        .ch-lyrics-close { background: none; border: none; color: var(--text3); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }
        .ch-lyrics-close:hover { color: var(--text); background: var(--bg3); }
        .ch-lyrics-body { flex: 1; overflow-y: auto; padding: 20px;scrollbar-width: thin; scrollbar-color: var(--bg3) transparent; }
        .ch-lyrics-song-info { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .ch-lyrics-cover-sm { width: 52px; height: 52px; border-radius: 8px; background: var(--bg3); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden; }
        .ch-lyrics-cover-sm img { width: 100%; height: 100%; object-fit: cover; }
        .ch-lyrics-song-name { font-size: 14px; font-weight: 600; }
        .ch-lyrics-song-artist { font-size: 12px; color: var(--text3); margin-top: 2px; }
        .ch-lyrics-text { font-size: 14px; line-height: 1.9; color: var(--text2); white-space: pre-wrap; }

        @media (max-width: 680px) {
          .ch-player { gap: 0; padding: 0 14px; justify-content: space-between; }
          .ch-player-info { min-width: 0; max-width: unset; flex: 1; gap: 8px; }
          .ch-player-cover { width: 42px; height: 42px; font-size: 18px; }
          .ch-player-center { flex: none; gap: 0; }
          .ch-progress-wrap { display: none; }
          .ch-player-right { display: none; }
          .ch-ctrl-btn.hide-mobile { display: none; }
          .ch-lyrics-btn { display: flex; font-size: 18px; }
          .ch-player-title { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        }
      `}</style>
      
      <header className="ch-header">
        <div className="ch-logo">
          <div className="ch-logo-icon">🎵</div>
          <div className="ch-logo-text">MyMusic2</div>
        </div>
        <div className="ch-search-wrap">
          <span className="ch-search-icon">🔍</span>
          <input 
            className="ch-search-input" 
            type="search" 
            placeholder="Buscar músicas, artistas..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="ch-logout-btn" onClick={() => signOut({ callbackUrl: '/login' })} title="Sair">⏻</button>
      </header>
      
      <div className="ch-song-list">
        {!songs.length && search === '' ? (
          <div className="ch-empty">Carregando músicas...</div>
        ) : filtered.length === 0 ? (
          <div className="ch-empty">
            <div className="ch-empty-icon">🎵</div>
            <h3>Nenhuma música encontrada</h3>
            <p>Tente outro termo de busca</p>
          </div>
        ) : (
          <>
            <div className="ch-song-count">{filtered.length} música{filtered.length !== 1 ? 's' : ''}</div>
            {filtered.map((s) => {
              const isSongPlaying = currentSong?.id === s.id
              const meta = [s.artist, s.album].filter(Boolean).join(' • ') || '—'
              const favClass = s.is_favorite ? ' fav' : ''
              const originIndex = songs.findIndex(x => x.id === s.id)
              return (
                <div 
                  key={s.id} 
                  className={`ch-song-row${isSongPlaying ? ' playing' : ''}${favClass}`}
                  onClick={() => playSong(originIndex)}
                >
                  <div className="ch-song-thumb">
                    {s.coverUrl ? <img src={s.coverUrl} alt="" /> : '🎵'}
                  </div>
                  <div className="ch-song-info">
                    <div className="ch-song-title">{s.title || 'Sem título'}</div>
                    <div className="ch-song-meta">{meta}</div>
                  </div>
                  <span className="ch-song-fav">♥</span>
                  <span className="ch-song-play-icon">▶</span>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="ch-player">
        <div className="ch-player-info">
          <div className="ch-player-cover">
            {currentSong?.coverUrl ? <img src={currentSong.coverUrl} alt="" /> : '🎵'}
          </div>
          <div className="ch-player-meta">
            <div className="ch-player-title">{currentSong?.title || 'Nenhuma música'}</div>
            <div className="ch-player-artist">{currentSong?.artist || '—'}</div>
          </div>
        </div>
        
        <div className="ch-player-center">
          <div className="ch-player-controls">
            <button className={`ch-ctrl-btn hide-mobile ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(!shuffle)} title="Aleatório">⇄</button>
            <button className="ch-ctrl-btn" onClick={prevSong}>⏮</button>
            <button className="ch-ctrl-btn ch-play-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="ch-ctrl-btn" onClick={nextSong}>⏭</button>
            <button className={`ch-ctrl-btn hide-mobile ${repeat ? 'active' : ''}`} onClick={() => setRepeat(!repeat)} title="Repetir">↺</button>
          </div>
          <div className="ch-progress-wrap">
            <span className="ch-time">{fmt(currentTime)}</span>
            <div className="ch-progress-bar" onClick={handleSeek}>
              <div 
                className="ch-progress-fill" 
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              >
                <div className="ch-progress-thumb"></div>
              </div>
            </div>
            <span className="ch-time right">{fmt(duration)}</span>
          </div>
        </div>

        <div className="ch-player-right">
          <span className="ch-vol-icon" onClick={toggleMute}>{getVolIcon()}</span>
          <input 
            type="range" 
            className="ch-vol-slider" 
            min="0" max="1" step="0.01" 
            value={muted ? 0 : volume} 
            onChange={e => {
              const val = parseFloat(e.target.value)
              setVolume(val)
              setMuted(val === 0)
            }}
          />
          <button 
            className="ch-ctrl-btn ch-lyrics-btn" 
            style={{ color: lyricsOpen ? 'var(--accent3)' : '' }}
            onClick={() => setLyricsOpen(!lyricsOpen)}
            title="Letra"
          >
            📝
          </button>
        </div>

        {isMobile && (
          <button 
            className="ch-ctrl-btn ch-lyrics-btn" 
            style={{ color: lyricsOpen ? 'var(--accent3)' : '' }}
            onClick={() => setLyricsOpen(!lyricsOpen)} 
            title="Letra"
          >
            📝
          </button>
        )}
      </div>

      <div className={`ch-lyrics-panel ${lyricsOpen ? 'open' : ''}`}>
        <div className="ch-lyrics-header">
          <h3>Letra</h3>
          <button className="ch-lyrics-close" onClick={() => setLyricsOpen(false)}>✕</button>
        </div>
        <div className="ch-lyrics-body">
          <div className="ch-lyrics-song-info">
            <div className="ch-lyrics-cover-sm">
              {currentSong?.coverUrl ? <img src={currentSong.coverUrl} alt="" /> : '🎵'}
            </div>
            <div>
              <div className="ch-lyrics-song-name">{currentSong?.title || '—'}</div>
              <div className="ch-lyrics-song-artist">{currentSong?.artist || '—'}</div>
            </div>
          </div>
          <div className="ch-lyrics-text">
            {currentSong ? (currentSong.lyrics || 'Nenhuma letra disponível') : 'Nenhuma letra disponível'}
          </div>
        </div>
      </div>
      
      <audio 
        ref={audioRef}
        src={currentSong?.fileUrl || undefined}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
            // also update next song triggers if it reaches the end in case onended has issues
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onEnded={() => {
          if (repeat) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              audioRef.current.play()
            }
          } else {
            nextSong()
          }
        }}
      />
    </div>
  )
}
