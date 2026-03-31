'use client'
import React, { useState, useRef } from 'react'
import { X, Music2, Image as ImageIcon, Plus } from 'lucide-react'

export interface DraftSong {
  title: string
  artist: string
  album: string
  genre: string
  year: string
  lyrics: string
  audioFile: File | null
  coverFile: File | null
}

function createNewDraft(): DraftSong {
  return {
    title: '', artist: '', album: '', genre: '', year: '', lyrics: '',
    audioFile: null, coverFile: null
  }
}

export function AddMusicModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [drafts, setDrafts] = useState<DraftSong[]>([])
  const [current, setCurrent] = useState<DraftSong>(createNewDraft())
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  function handleAddPlus() {
    if (!current.audioFile) {
      alert('Selecione um arquivo de áudio antes de adicionar outra música.')
      return
    }
    setDrafts([...drafts, current])
    setCurrent(createNewDraft())
  }

  async function handleSave() {
    const list = [...drafts]
    if (current.audioFile) {
      list.push(current)
    }
    
    if (list.length === 0) {
      alert('Nenhuma música selecionada para upload.')
      return
    }

    setIsUploading(true)
    let completed = 0

    for (const draft of list) {
      try {
        // 1. Get presigned URL for audio
        const presignRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: draft.audioFile!.name, contentType: draft.audioFile!.type, size: draft.audioFile!.size }),
        })
        const { uploadUrl, key } = await presignRes.json()

        // 2. Upload audio to R2
        await fetch(uploadUrl, { method: 'PUT', body: draft.audioFile, headers: { 'Content-Type': draft.audioFile!.type } })

        // 3. Upload cover if exists
        let coverUrlObj = null
        if (draft.coverFile) {
          const cRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'cover_' + draft.coverFile.name, contentType: draft.coverFile.type, size: draft.coverFile.size }),
          })
          const cData = await cRes.json()
          await fetch(cData.uploadUrl, { method: 'PUT', body: draft.coverFile, headers: { 'Content-Type': draft.coverFile.type } })
          coverUrlObj = cData.key
        }

        // 4. Get duration
        const dur = await new Promise<number>(resolve => {
          const audio = new window.Audio()
          audio.src = URL.createObjectURL(draft.audioFile!)
          audio.onloadedmetadata = () => { URL.revokeObjectURL(audio.src); resolve(Math.floor(audio.duration)) }
          audio.onerror = () => resolve(0)
        })

        // 5. Save to DB (only passing supported fields for now, others simulate locally)
        await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: draft.title || draft.audioFile!.name.replace(/\.[^.]+$/, ''), 
            artist: draft.artist || 'Artista Desconhecido', 
            album: draft.album, 
            genre: draft.genre,
            year: draft.year,
            lyrics: draft.lyrics,
            duration: dur, 
            fileKey: key, 
            coverUrl: coverUrlObj, 
            size: draft.audioFile!.size, 
            mimeType: draft.audioFile!.type 
          }),
        })

        completed++
        setProgress(Math.floor((completed / list.length) * 100))
      } catch (err) {
        console.error('Upload failed for', draft.title, err)
      }
    }

    setIsUploading(false)
    setDrafts([])
    setCurrent(createNewDraft())
    setProgress(0)
    onSuccess()
    onClose()
  }

  function handleAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setCurrent({ ...current, audioFile: file, title: current.title || file.name.replace(/\.[^.]+$/, '') })
    }
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setCurrent({ ...current, coverFile: e.target.files[0] })
  }

  function handleCancel() {
    const hasData = drafts.length > 0 || current.audioFile || current.title || current.artist
    if (hasData) {
      setShowCancelConfirm(true)
    } else {
      onClose()
    }
  }

  function confirmCancel() {
    setShowCancelConfirm(false)
    setDrafts([])
    setCurrent(createNewDraft())
    setProgress(0)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', padding: '20px'
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
        width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Adicionar Música</h2>
            {drafts.length > 0 && <span style={{ background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{drafts.length} prontas</span>}
          </div>
          <button onClick={handleCancel} style={{ color: '#888', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Nome da música *</label>
              <input value={current.title} onChange={e => setCurrent({...current, title: e.target.value})} placeholder="Ex: Bohemian Rhapsody" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Artista</label>
              <input value={current.artist} onChange={e => setCurrent({...current, artist: e.target.value})} placeholder="Ex: Queen" style={inputStyle} />
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Álbum</label>
              <input value={current.album} onChange={e => setCurrent({...current, album: e.target.value})} placeholder="Ex: A Night at the Opera" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Gênero</label>
              <input value={current.genre} onChange={e => setCurrent({...current, genre: e.target.value})} placeholder="Ex: Rock, Pop, Jazz..." style={inputStyle} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ width: 'calc(50% - 8px)' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Ano</label>
            <input value={current.year} onChange={e => setCurrent({...current, year: e.target.value})} placeholder="2024" style={inputStyle} />
          </div>

          {/* Audio Dropzone */}
          <div 
            onClick={() => audioInputRef.current?.click()}
            style={{ 
              border: '1px dashed #444', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer',
              background: current.audioFile ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
              borderColor: current.audioFile ? 'var(--accent)' : '#444'
            }}
          >
            <Music2 size={24} color={current.audioFile ? "var(--accent)" : "#888"} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              {current.audioFile ? current.audioFile.name : 'Clique para carregar o áudio'}
            </h4>
            <p style={{ fontSize: '12px', color: '#666' }}>MP3, WAV, FLAC, OGG, M4A — até 50MB</p>
            <input type="file" ref={audioInputRef} accept="audio/*" style={{ display: 'none' }} onChange={handleAudioSelect} />
          </div>

          {/* Cover Dropzone */}
          <div 
            onClick={() => coverInputRef.current?.click()}
            style={{ 
              border: '1px dashed #444', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer',
              background: current.coverFile ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
              borderColor: current.coverFile ? 'var(--accent)' : '#444'
            }}
          >
            <ImageIcon size={24} color={current.coverFile ? "var(--accent)" : "#888"} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              {current.coverFile ? current.coverFile.name : 'Capa da música (opcional)'}
            </h4>
            <p style={{ fontSize: '12px', color: '#666' }}>JPG, PNG, WEBP — até 5MB</p>
            <input type="file" ref={coverInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleCoverSelect} />
          </div>

          {/* Lyrics */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>Letra da música</label>
            <textarea 
              value={current.lyrics} onChange={e => setCurrent({...current, lyrics: e.target.value})}
              placeholder="Cole a letra aqui..." 
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '20px 24px', borderTop: '1px solid #333', background: '#141414', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          {isUploading ? (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '6px', background: '#333', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: '13px', color: '#888' }}>Enviando...</span>
            </div>
          ) : (
            <>
              <button onClick={handleCancel} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#aaa', border: '1px solid #444', borderRadius: '8px', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={handleAddPlus} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', border: '1px solid #444', borderRadius: '8px', background: '#222', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Adicionar Outra
              </button>
              <button onClick={handleSave} style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#000', borderRadius: '8px', background: '#b065f9' }}>
                Salvar
              </button>
            </>
          )}
        </div>
        
      </div>

      {/* Cancel Confirmation Overlay */}
      {showCancelConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)'
        }}>
          <div style={{
            background: '#1e1e1e', border: '1px solid #444', borderRadius: '12px',
            padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <X size={24} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Cancelar upload?</h3>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.5, marginBottom: '24px' }}>
              {drafts.length > 0
                ? `Você tem ${drafts.length + (current.audioFile ? 1 : 0)} música(s) carregada(s). Todos os dados serão descartados.`
                : 'Os dados preenchidos serão descartados.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#aaa', border: '1px solid #444', borderRadius: '8px', background: 'transparent' }}
              >
                Voltar
              </button>
              <button
                onClick={confirmCancel}
                style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#fff', borderRadius: '8px', background: '#ef4444', border: 'none' }}
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: '#222',
  border: '1px solid #333',
  padding: '12px 14px',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s'
}
