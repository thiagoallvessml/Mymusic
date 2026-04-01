'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { StudioTermsModal } from '@/components/studio/StudioTermsModal'
import { Search, Music2, Settings2, Download, Play, Pause, AlertCircle, Loader2, Info, Crown, ArrowUpRight, Lock, Menu } from 'lucide-react'
import { PitchShifter, SoundTouch, SimpleFilter, WebAudioBufferSource } from 'soundtouchjs'

interface Song {
  id: string
  title: string
  artist: string
  fileUrl: string
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
  const [searchQuery, setSearchQuery] = useState('')
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('studio_terms_accepted') === 'true'
      setHasAcceptedTerms(accepted)
    }
  }, [])

  function handleAcceptTerms() {
    localStorage.setItem('studio_terms_accepted', 'true')
    setHasAcceptedTerms(true)
  }
  
  const [pitchShift, setPitchShift] = useState(-1) // default -1 semitone
  const [isEditingPitch, setIsEditingPitch] = useState(false)
  const [pitchInput, setPitchInput] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [errorLine, setErrorLine] = useState('')
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Preview state
  const [shifter, setShifter] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const previewCtxRef = useRef<AudioContext | null>(null)
  
  const [showPaywall, setShowPaywall] = useState(false)
  
  const userPlan = (session?.user as any)?.plan || 'FREE'
  const studioCredits = (session?.user as any)?.studioCredits || 0
  const hasStudioAccess = userPlan === 'ADVANCED'
  const canGenerate = hasStudioAccess || studioCredits > 0
  const studioPrice = userPlan === 'BASIC' ? '7,99' : userPlan === 'INTERMEDIATE' ? '5,99' : '9,99'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSongs(d)
    })
    
    // Cleanup AudioContext only when component unmounts
    return () => {
      if (previewCtxRef.current && previewCtxRef.current.state !== 'closed') {
        previewCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    setIsPlaying(false)
    if (shifter && shifter.stop) {
      try { shifter.stop() } catch(e) {}
    }
  }, [selectedSong, pitchShift])

  async function handlePreview() {
    if (!selectedSong) return
    setErrorLine('')
    try {
      if (isPlaying) {
        if (shifter && shifter.stop) {
          try { shifter.stop() } catch(e) {}
          try { shifter.disconnect() } catch(e) {}
        }
        setIsPlaying(false)
        return
      }

      setProgressMsg('Carregando prévia...')
      if (shifter && shifter.stop) {
        try { shifter.stop() } catch(e) {}
        try { shifter.disconnect() } catch(e) {}
        setShifter(null)
      }

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      let ctx = previewCtxRef.current
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContextCtor()
        previewCtxRef.current = ctx
      } else if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      setProgressMsg('Baixando áudio...')
      const response = await fetch(selectedSong.fileUrl)
      if (!response.ok) throw new Error(`Falha ao baixar música (status ${response.status})`)
      const arrayBuffer = await response.arrayBuffer()
      
      setProgressMsg('Decodificando áudio...')
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      
      setProgressMsg('Processando pitch (pode levar alguns segundos)...')
      const maxFramesForPreview = 45 * audioBuffer.sampleRate
      const previewBuffer = await renderOfflineSoundTouch(audioBuffer, pitchShift, maxFramesForPreview)

      if (previewBuffer.length === 0) throw new Error('Nenhum áudio foi gerado pelo processador')

      const sourceNode = ctx.createBufferSource()
      sourceNode.buffer = previewBuffer
      
      const gainNode = ctx.createGain()
      sourceNode.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      setShifter(sourceNode)
      sourceNode.start()
      setIsPlaying(true)
      setProgressMsg('')

      sourceNode.onended = () => {
         setIsPlaying(false)
      }

    } catch (err: any) {
      console.error('Preview error:', err)
      setErrorLine(`Erro na prévia: ${err.message || 'Falha desconhecida'}`)
      setProgressMsg('')
      setIsPlaying(false)
    }
  }

  function startSimulatedProgress(from: number, to: number, durationMs: number) {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    let current = from
    const step = (to - from) / (durationMs / 100)
    progressTimerRef.current = setInterval(() => {
      current = Math.min(current + step, to)
      setProgressPct(Math.round(current))
      if (current >= to && progressTimerRef.current) clearInterval(progressTimerRef.current)
    }, 100)
  }

  function stopSimulatedProgress() {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
  }

  async function renderOfflineSoundTouch(audioBuffer: AudioBuffer, semitones: number, maxFrames?: number): Promise<AudioBuffer> {
    const source = new (WebAudioBufferSource as any)(audioBuffer)
    const st = new (SoundTouch as any)()
    st.pitchSemitones = semitones
    const filter = new (SimpleFilter as any)(source, st)

    const chunks: { l: Float32Array; r: Float32Array }[] = []
    const extractBuffer = new Float32Array(4096)
    const limit = maxFrames || audioBuffer.length
    let totalExtracted = 0

    while (totalExtracted < limit) {
      const n = filter.extract(extractBuffer, 2048)
      if (n === 0) break

      const l = new Float32Array(n)
      const r = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        l[i] = extractBuffer[i * 2]
        r[i] = extractBuffer[i * 2 + 1]
      }
      chunks.push({ l, r })
      totalExtracted += n

      // yield to the UI thread every 50 chunks
      if (chunks.length % 50 === 0) {
        await new Promise(res => setTimeout(res, 0))
      }
    }

    const outputLength = chunks.reduce((sum, c) => sum + c.l.length, 0)
    if (outputLength === 0) throw new Error('SoundTouch não extraiu nenhum frame de áudio')

    const offCtx = new OfflineAudioContext(2, outputLength, audioBuffer.sampleRate)
    const outBuf = offCtx.createBuffer(2, outputLength, audioBuffer.sampleRate)
    const outL = outBuf.getChannelData(0)
    const outR = outBuf.getChannelData(1)
    let off = 0
    for (const c of chunks) {
      outL.set(c.l, off)
      outR.set(c.r, off)
      off += c.l.length
    }
    return outBuf
  }

  async function processAndSave() {
    if (!selectedSong) return
    if (isProcessing) return
    
    setIsProcessing(true)
    setErrorLine('')
    setProgressPct(0)
    
    try {
      if (shifter && shifter.stop) {
        try { shifter.stop() } catch(e) {}
      }
      setIsPlaying(false)

      // 0-15%: Download original file
      setProgressMsg('Baixando áudio original...')
      startSimulatedProgress(0, 15, 3000)
      
      const response = await fetch(selectedSong.fileUrl)
      if (!response.ok) throw new Error("Falha ao baixar áudio")
      const originalData = new Uint8Array(await response.arrayBuffer())
      
      stopSimulatedProgress()
      setProgressPct(15)

      // 15-25%: Load FFmpeg
      setProgressMsg('Carregando motor de processamento FFmpeg...')
      startSimulatedProgress(15, 25, 3000)
      
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      })
      
      stopSimulatedProgress()
      setProgressPct(25)

      // 25-70%: FFmpeg pitch shift + MP3 encode (one pass)
      setProgressMsg('Processando tom com FFmpeg (qualidade de estúdio)...')
      startSimulatedProgress(25, 70, Math.max((selectedSong.duration || 180) * 300, 5000))

      // Detect file extension from URL
      const urlPath = new URL(selectedSong.fileUrl).pathname
      const ext = urlPath.split('.').pop()?.toLowerCase() || 'mp3'
      const inputFile = `input.${ext}`
      
      await ffmpeg.writeFile(inputFile, originalData)

      // Build the audio filter for pitch shifting
      // asetrate: changes pitch by altering sample rate (rate = 2^(semitones/12))
      // aresample: resamples back to 44100 to normalize sample rate
      // atempo: compensates the speed change (tempo = 2^(-semitones/12))
      // Combined, this shifts pitch without changing speed
      const rateFactor = Math.pow(2, pitchShift / 12)
      const tempoFactor = 1 / rateFactor
      
      // atempo only accepts 0.5-100.0, so chain multiple for extreme values
      let atempoFilters: string[] = []
      let remaining = tempoFactor
      while (remaining < 0.5) {
        atempoFilters.push('atempo=0.5')
        remaining /= 0.5
      }
      while (remaining > 2.0) {
        atempoFilters.push('atempo=2.0')
        remaining /= 2.0
      }
      atempoFilters.push(`atempo=${remaining.toFixed(6)}`)

      const filterChain = `asetrate=44100*${rateFactor.toFixed(6)},aresample=44100,${atempoFilters.join(',')}`
      
      await ffmpeg.exec([
        '-i', inputFile,
        '-af', filterChain,
        '-codec:a', 'libmp3lame',
        '-b:a', '192k',
        '-y', 'output.mp3'
      ])
      
      const mp3Data = await ffmpeg.readFile('output.mp3')
      const mp3Blob = new Blob([mp3Data], { type: 'audio/mpeg' })
      
      // Get duration from original
      const duration = selectedSong.duration || 0
      
      ffmpeg.terminate()
      
      stopSimulatedProgress()
      setProgressPct(75)
      
      const filename = `${selectedSong.title}_Tom_${pitchShift}.mp3`

      // 75-80%: Get presigned URL
      setProgressMsg('Preparando upload...')
      setProgressPct(77)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          contentType: 'audio/mpeg',
          size: mp3Blob.size,
          isStudioAction: true
        })
      })
      
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Erro ao gerar URL de upload")
      const { uploadUrl, key } = uploadData
      setProgressPct(80)

      // 80-90%: Upload to R2
      setProgressMsg('Enviando MP3 para nuvem...')
      startSimulatedProgress(80, 88, 4000)
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: mp3Blob,
        headers: { 'Content-Type': 'audio/mpeg' }
      })
      
      if (!putRes.ok) throw new Error("Erro ao enviar arquivo para o armazenamento")
      stopSimulatedProgress()
      setProgressPct(90)

      // 90-100%: Save metadata
      setProgressMsg('Salvando metadados...')
      const newTitle = `${selectedSong.title} (Tom ${pitchShift > 0 ? '+'+pitchShift : pitchShift})`
      const metaRes = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          artist: selectedSong.artist,
          fileKey: key,
          duration: Math.round(duration),
          size: mp3Blob.size,
          mimeType: 'audio/mpeg',
          isStudioAction: true
        })
      })
      
      const metaData = await metaRes.json()
      if (!metaRes.ok) throw new Error(metaData.error || "Erro ao salvar metadados")
      
      setProgressPct(100)
      setProgressMsg('MP3 salvo com sucesso na sua biblioteca!')
      setTimeout(() => {
        setProgressMsg('')
        setProgressPct(0)
        router.push('/library')
      }, 2000)

    } catch (err: any) {
      console.error(err)
      stopSimulatedProgress()
      setErrorLine(`Erro: ${err.message || 'Falha no processamento.'}`)
      setProgressMsg('')
      setProgressPct(0)
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="layout-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="mobile-header-padding hide-on-desktop" style={{
          display: 'flex', alignItems: 'center', padding: '24px 40px', background: 'var(--bg)',
          position: 'sticky', top: 0, zIndex: 30
        }}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ color: 'var(--text)', display: 'block' }}
            className="mobile-hamburger"
          >
            <Menu size={24} />
          </button>
        </header>

        <main style={{ flex: 1, padding: '0 40px 40px 40px', maxWidth: '1200px' }} className="mobile-content-padding">
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Estúdio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Ajuste o tom das suas faixas salvando novas versões sem perder a velocidade final.</p>

        {/* Plan Status Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
          background: hasStudioAccess ? 'var(--accent-dim)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${hasStudioAccess ? 'var(--accent)' : 'rgba(239, 68, 68, 0.25)'}`,
          borderRadius: '12px', marginBottom: '28px', flexWrap: 'wrap'
        }}>
          <Crown size={18} color={hasStudioAccess ? 'var(--accent)' : '#ef4444'} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>
            {hasStudioAccess ? (
              <><strong>Plano Advanced</strong> — Geração ilimitada de tons ativa.</>              
            ) : (
              <>
                Plano <strong>{userPlan}</strong> — A prévia é gratuita. Para gerar e salvar, 
                {canGenerate 
                  ? <> você tem <strong style={{ color: 'var(--accent)' }}>{studioCredits} crédito{studioCredits !== 1 ? 's' : ''}</strong> disponíve{studioCredits !== 1 ? 'is' : 'l'}.</>
                  : <> compre um crédito avulso por <strong>R$ {studioPrice}</strong> ou faça upgrade.</>
                }
              </>
            )}
          </p>
          {!hasStudioAccess && (
            <a href="/plans" style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px',
              background: 'var(--accent)', color: '#000', borderRadius: '100px',
              fontWeight: 700, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap'
            }}>
              Ver Planos <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Box de Seleção */}
          <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>1. Escolher Música Original</h2>
            
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-3)', opacity: 0.8, borderRadius: '8px',
              padding: '10px 16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                placeholder="Buscar músicas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', fontSize: '13px', width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
              {songs.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sua biblioteca está vazia.</p>}
              
              {(() => {
                const filtered = songs.filter(s => 
                  s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.artist.toLowerCase().includes(searchQuery.toLowerCase())
                )
                
                if (songs.length > 0 && filtered.length === 0) {
                  return <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhuma música encontrada.</p>
                }

                return filtered.map(song => (
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
              ))})()}
            </div>
          </div>

          {/* Box de Ajuste */}
          <div style={{ background: 'var(--bg-2)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', opacity: selectedSong ? 1 : 0.5, pointerEvents: selectedSong && !isProcessing ? 'auto' : 'none' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>
              2. Configurar Modificação
              {selectedSong && <span style={{ color: 'var(--accent)', fontWeight: 400, marginLeft: '8px' }}>- {selectedSong.title}</span>}
            </h2>
            
            <div style={{ padding: '12px 16px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                <strong>Aviso:</strong> Para usar a Configuração de tom, mexa na barra abaixo para a esquerda ou direita, ou clique no número para digitar manualmente.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Tom (Semitons)</span>
              {isEditingPitch ? (
                <input 
                  type="text"
                  autoFocus
                  value={pitchInput}
                  onChange={e => setPitchInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingPitch(false)
                    const val = parseInt(pitchInput)
                    if (!isNaN(val) && val >= -24 && val <= 24) setPitchShift(val)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                  }}
                  style={{ background: 'var(--bg-4)', padding: '3px 10px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, color: 'var(--accent)', width: '48px', textAlign: 'center', border: 'none', outline: 'none' }}
                />
              ) : (
                <span 
                  onClick={() => { setIsEditingPitch(true); setPitchInput(pitchShift.toString()) }}
                  title="Clique para editar"
                  style={{ background: 'var(--bg-4)', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-4)'}
                >
                  {pitchShift > 0 ? `+${pitchShift}` : pitchShift}
                </span>
              )}
            </div>
            
            <input 
              type="range" 
              min="-12" max="12" step="1" 
              value={pitchShift}
              onChange={e => setPitchShift(Number(e.target.value))}
              className="thick-slider"
              style={{ width: '100%', marginBottom: '16px', accentColor: 'var(--accent)', height: '8px', cursor: 'pointer' }}
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
                {isPlaying ? 'Parar Prévia' : 'Ouvir Prévia Gratuita'}
              </button>

              <button 
                onClick={() => {
                  if (!canGenerate) {
                    setShowPaywall(true)
                    return
                  }
                  processAndSave()
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', 
                  background: canGenerate ? 'var(--accent)' : 'var(--bg-4)',
                  color: canGenerate ? '#000' : 'var(--text-muted)',
                  border: canGenerate ? 'none' : '1px solid var(--border)', 
                  borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                }}
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : canGenerate ? (
                  <Download size={18} />
                ) : (
                  <Lock size={18} />
                )}
                {isProcessing 
                  ? 'Processando...' 
                  : canGenerate 
                    ? (hasStudioAccess ? 'Processar e Salvar' : `Processar (1 crédito)`)
                    : `Desbloquear (R$ ${studioPrice})`
                }
              </button>

              {!hasStudioAccess && canGenerate && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Você tem {studioCredits} crédito{studioCredits !== 1 ? 's' : ''} restante{studioCredits !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Warnings and Status */}
            {progressMsg && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-3)', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isProcessing ? '12px' : '0' }}>
                  {isProcessing && <Loader2 size={16} className="animate-spin" color="var(--accent)" />}
                  <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, flex: 1 }}>{progressMsg}</p>
                  {isProcessing && <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{progressPct}%</span>}
                </div>
                {isProcessing && (
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-4)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))', borderRadius: '3px', transition: 'width 0.15s ease-out' }} />
                  </div>
                )}
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
      </div>
      
      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent)' }}>Acesso ao Estúdio</h3>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              O uso do Estúdio é gratuito apenas no <strong>Plano Advanced</strong>. Seu plano atual é o <strong>{userPlan}</strong>.
            </p>
            
            <div style={{ background: 'var(--bg-3)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Gerar Música Avulsa:</p>
              <ul style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, paddingLeft: '20px' }}>
                <li style={{ color: userPlan === 'FREE' ? 'var(--text)' : 'inherit' }}>Plano Free: R$ 9,99</li>
                <li style={{ color: userPlan === 'BASIC' ? 'var(--text)' : 'inherit' }}>Plano Básico: R$ 7,99</li>
                <li style={{ color: userPlan === 'INTERMEDIATE' ? 'var(--text)' : 'inherit' }}>Plano Intermediário: R$ 5,99</li>
              </ul>
            </div>
            
            <button 
              onClick={async () => {
                alert('Aqui abriria o checkout do Stripe/MercadoPago para comprar 1 crédito! Simulando sucesso...')
                try {
                  const res = await fetch('/api/checkout/studio', { method: 'POST' })
                  if (res.ok) {
                    alert('Crédito adicionado com sucesso! Agora você pode processar.')
                    setShowPaywall(false)
                    // Reloading session would be ideal, but for the mock it doesn't matter because processAndSave checks session.user AND server DB. Actually the frontend will still block unless we manually reload or update the state.
                    window.location.reload()
                  }
                } catch (e) { console.log(e) }
              }}
              style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}
            >
              Comprar 1 Geração (R$ {userPlan === 'BASIC' ? '7,99' : userPlan === 'INTERMEDIATE' ? '5,99' : '9,99'})
            </button>
            <button 
              onClick={() => setShowPaywall(false)}
              style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* CSS For spin animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (min-width: 769px) {
          .hide-on-desktop { display: none !important; }
        }
      `}} />

      {/* Terms of Use Modal */}
      {!hasAcceptedTerms && (
        <StudioTermsModal onAccept={handleAcceptTerms} />
      )}
    </div>
  )
}
