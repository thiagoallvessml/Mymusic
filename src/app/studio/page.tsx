'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Search, Music2, Settings2, Download, Play, Pause, AlertCircle, Loader2 } from 'lucide-react'
import * as Tone from 'tone'

interface Song {
  id: string
  title: string
  artist: string
  audio_path: string
  duration: number
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let lengths = [];
  for (let i = 0; i < numChannels; i++) {
    lengths.push(buffer.getChannelData(i).length);
  }
  const length = Math.min(...lengths);
  const interleaved = new Float32Array(length * numChannels);

  for (let i = 0; i < numChannels; i++) {
    const channel = buffer.getChannelData(i);
    for (let j = 0; j < length; j++) {
      interleaved[j * numChannels + i] = channel[j];
    }
  }

  const dataLength = interleaved.length * 2;
  const bufferData = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferData);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    let sample = Math.max(-1, Math.min(1, interleaved[i]));
    sample = sample < 0 ? sample * 32768 : sample * 32767;
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

export default function StudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [songs, setSongs] = useState<Song[]>([])
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  
  const [pitchShift, setPitchShift] = useState(-1) // default -1 semitone
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorLine, setErrorLine] = useState('')

  // Preview state
  const [previewPlayer, setPreviewPlayer] = useState<Tone.Player | null>(null)
  const [previewEffect, setPreviewEffect] = useState<Tone.PitchShift | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSongs(d)
    })
    
    return () => {
      // cleanup preview on unmount
      if (previewPlayer) {
        previewPlayer.stop()
        previewPlayer.dispose()
      }
      if (previewEffect) {
        previewEffect.dispose()
      }
    }
  }, [])

  // Limpa o player sempre que trocar de música ou tom (evita poluição na RAM)
  useEffect(() => {
    setIsPlaying(false)
    if (previewPlayer) previewPlayer.stop()
  }, [selectedSong, pitchShift])

  async function handlePreview() {
    if (!selectedSong) return
    setErrorLine('')
    try {
      await Tone.start()
      
      if (isPlaying) {
        previewPlayer?.stop()
        setIsPlaying(false)
        return
      }

      setProgressMsg('Carregando áudio para preview...')
      if (previewPlayer) {
        previewPlayer.dispose()
      }
      if (previewEffect) {
        previewEffect.dispose()
      }

      // Use Tone.ToneAudioBuffer that has better codec support than raw decodeAudioData
      const toneBuffer = new Tone.ToneAudioBuffer()
      await toneBuffer.load(selectedSong.audio_path)

      const player = new Tone.Player(toneBuffer)
      const pitch = new Tone.PitchShift({ pitch: pitchShift }).toDestination()
      
      player.connect(pitch)
      
      setPreviewPlayer(player)
      setPreviewEffect(pitch)
      
      player.start()
      setIsPlaying(true)
      setProgressMsg('')
      
      // Auto-pause preview when track ends
      player.onstop = () => setIsPlaying(false)

    } catch (err: any) {
      console.error('Preview error:', err)
      setErrorLine('Erro ao carregar prévia. Formato de áudio pode não ser suportado pelo navegador.')
      setProgressMsg('')
      setIsPlaying(false)
    }
  }

  async function processAndSave() {
    if (!selectedSong) return
    if (isProcessing) return
    
    setIsProcessing(true)
    setErrorLine('')
    
    try {
      if (previewPlayer) previewPlayer.stop()
      setIsPlaying(false)

      setProgressMsg('Baixando e decodificando áudio original...')
      
      // Use Tone.ToneAudioBuffer which has better codec support across browsers
      const toneBuffer = new Tone.ToneAudioBuffer()
      await toneBuffer.load(selectedSong.audio_path)
      const audioBuffer = toneBuffer.get()
      
      if (!audioBuffer) throw new Error("Falha ao decodificar o áudio original")
      
      setProgressMsg(`Modificando tom em renderização offline...`)
      const duration = audioBuffer.duration
      
      // Essa função bloqueia o contexto, renderizando toda a faixa o mais rápido possível no motor do browser
      const renderedBuffer = await Tone.Offline(async () => {
        const offlinePlayer = new Tone.Player(audioBuffer)
        const offlinePitch = new Tone.PitchShift({ pitch: pitchShift }).toDestination()
        offlinePlayer.connect(offlinePitch)
        offlinePlayer.start(0)
      }, duration)

      setProgressMsg('Convertendo para formato padrão...')
      const rawAudioBuffer = renderedBuffer.get()
      if (!rawAudioBuffer) throw new Error("A renderização falhou gerar um canal válido")
      
      const wavBlob = audioBufferToWav(rawAudioBuffer)
      const wavFile = new File([wavBlob], `${selectedSong.title}_Tom_${pitchShift}.wav`, { type: 'audio/wav' })

      setProgressMsg('Fazendo upload p/ Cloudflare (salvando)...')
      
      const formData = new FormData()
      formData.append('file', wavFile)
      formData.append('title', `${selectedSong.title} (Tom ${pitchShift > 0 ? '+'+pitchShift : pitchShift})`)
      formData.append('artist', selectedSong.artist)

      const saveRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!saveRes.ok) throw new Error("Erro no upload")
      
      setProgressMsg('Salvo com sucesso na sua biblioteca!')
      setTimeout(() => {
        setProgressMsg('')
        router.push('/library')
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setErrorLine(`Erro: ${err.message || 'Formato de áudio não suportado pelo navegador.'}`)
      setProgressMsg('')
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar isOpen={false} onClose={() => {}} />

      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px' }} className="mobile-content-padding layout-main">
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Estúdio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Ajuste o tom das suas faixas salvando novas versões sem perder a velocidade final.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Box de Seleção */}
          <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>1. Escolher Música Original</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {songs.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sua biblioteca está vazia.</p>}
              
              {songs.map(song => (
                <div 
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  style={{
                    padding: '12px', background: selectedSong?.id === song.id ? 'var(--bg-4)' : 'var(--bg-3)',
                    border: '1px solid', borderColor: selectedSong?.id === song.id ? 'var(--accent)' : 'transparent',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Music2 size={16} color="var(--accent)" />
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box de Ajuste */}
          <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', opacity: selectedSong ? 1 : 0.5, pointerEvents: selectedSong && !isProcessing ? 'auto' : 'none' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>2. Configurar Modificação</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Tom (Semitons)</span>
              <span style={{ background: 'var(--bg-4)', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                {pitchShift > 0 ? `+${pitchShift}` : pitchShift}
              </span>
            </div>
            
            <input 
              type="range" 
              min="-12" max="12" step="1" 
              value={pitchShift}
              onChange={e => setPitchShift(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '16px', accentColor: 'var(--accent)' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
              <span>-1 Oitava (-12)</span>
              <span>Original (0)</span>
              <span>+1 Oitava (+12)</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handlePreview}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', background: 'var(--bg-3)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Parar Prévia' : 'Ouvir Prévia Rápida'}
              </button>

              <button 
                onClick={processAndSave}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', background: 'var(--accent)', color: '#000',
                  border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                }}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                Processar e Salvar Nova Música
              </button>
            </div>

            {/* Warnings and Status */}
            {progressMsg && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-3)', borderRadius: '8px', borderLeft: '3px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isProcessing && <Loader2 size={16} className="animate-spin" color="var(--accent)" />}
                <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{progressMsg}</p>
              </div>
            )}
            
            {errorLine && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '3px solid #ef4444', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={16} color="#ef4444" />
                <p style={{ fontSize: '13px', color: '#f87171', fontWeight: 500 }}>{errorLine}</p>
              </div>
            )}
          </div>
          
        </div>
      </main>
      
      {/* CSS For spin animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  )
}
