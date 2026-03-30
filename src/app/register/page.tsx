'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/login?registered=1')
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao criar conta')
      setLoading(false)
    }
  }
  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</label>
      <input
        type={type} 
        value={form[key as keyof typeof form]} 
        required 
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '12px 14px', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text)', fontSize: '14px', outline: 'none'
        }}
      />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', background: 'var(--bg-2)',
        borderRadius: '16px', padding: '40px', border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎵</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Criar conta</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>Comece sua biblioteca pessoal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {field('Usuário', 'name', 'text', 'Seu nome de usuário')}
          {field('Email', 'email', 'email', 'seu@email.com')}
          {field('Senha', 'password', 'password', '••••••••')}

          {error && <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '13px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '15px',
              marginTop: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
