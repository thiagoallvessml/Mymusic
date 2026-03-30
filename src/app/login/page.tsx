'use client'
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { name, password, redirect: false })
    if (res?.error) {
      setError('Nome ou senha inválidos')
      setLoading(false)
    } else {
      const session = await getSession()
      if ((session?.user as any)?.role === 'CHURCH') {
        router.push('/church')
      } else {
        router.push('/library')
      }
    }
  }

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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>MyMusic</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>Entre na sua biblioteca</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Usuário</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="Seu nome"
              style={{
                width: '100%', padding: '12px 14px', background: 'var(--bg-3)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--text)', fontSize: '14px', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Senha</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 14px', background: 'var(--bg-3)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--text)', fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '13px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '15px',
              transition: 'background 0.2s', marginTop: '8px',
              opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Não tem conta?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
