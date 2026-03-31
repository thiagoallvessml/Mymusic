'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Crown, Music2, Zap, Infinity, Check, X, Sparkles } from 'lucide-react'

const PLANS = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    icon: Music2,
    color: '#888',
    features: [
      { text: 'Upload de até 2 músicas', included: true },
      { text: 'Player completo', included: true },
      { text: 'Playlists e favoritos', included: true },
      { text: 'Acesso ao Estúdio', included: false },
      { text: 'Uso avulso do Estúdio: R$ 9,99', included: true },
    ],
  },
  {
    id: 'BASIC',
    name: 'Básico',
    price: 'R$ 9,90',
    period: '/mês',
    icon: Zap,
    color: '#3b82f6',
    features: [
      { text: 'Upload de até 100 músicas', included: true },
      { text: 'Player completo', included: true },
      { text: 'Playlists e favoritos', included: true },
      { text: 'Acesso ao Estúdio', included: false },
      { text: 'Uso avulso do Estúdio: R$ 7,99', included: true },
    ],
  },
  {
    id: 'INTERMEDIATE',
    name: 'Intermediário',
    price: 'R$ 19,90',
    period: '/mês',
    icon: Crown,
    color: '#f59e0b',
    popular: true,
    features: [
      { text: 'Upload de até 500 músicas', included: true },
      { text: 'Player completo', included: true },
      { text: 'Playlists e favoritos', included: true },
      { text: 'Acesso ao Estúdio', included: false },
      { text: 'Uso avulso do Estúdio: R$ 5,99', included: true },
    ],
  },
  {
    id: 'ADVANCED',
    name: 'Advanced',
    price: 'R$ 29,90',
    period: '/mês',
    icon: Sparkles,
    color: '#a855f7',
    features: [
      { text: 'Upload ilimitado de músicas', included: true },
      { text: 'Player completo', included: true },
      { text: 'Playlists e favoritos', included: true },
      { text: 'Acesso total ao Estúdio', included: true },
      { text: 'Geração ilimitada de tons', included: true },
    ],
  },
]

export default function PlansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState('FREE')
  const [songCount, setSongCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    const plan = (session?.user as any)?.plan
    if (plan) setCurrentPlan(plan)

    fetch('/api/songs').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSongCount(d.length)
    })
  }, [session])

  if (status === 'loading') return null

  function getLimitForPlan(planId: string) {
    if (planId === 'FREE') return 2
    if (planId === 'BASIC') return 100
    if (planId === 'INTERMEDIATE') return 500
    return Infinity
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar isOpen={false} onClose={() => {}} />

      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px' }} className="mobile-content-padding layout-main">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>
            Escolha seu Plano
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Desbloqueie mais músicas e acesso ao Estúdio profissional de mudança de tom.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          marginBottom: '40px', padding: '12px 24px', background: 'var(--accent-dim)', 
          border: '1px solid var(--accent)', borderRadius: '12px', width: 'fit-content', margin: '0 auto 40px'
        }}>
          <Crown size={18} color="var(--accent)" />
          <span style={{ fontSize: '14px' }}>
            Plano atual: <strong style={{ color: 'var(--accent)' }}>{PLANS.find(p => p.id === currentPlan)?.name || currentPlan}</strong>
            {' · '}
            <span style={{ color: 'var(--text-muted)' }}>{songCount} / {getLimitForPlan(currentPlan) === Infinity ? '∞' : getLimitForPlan(currentPlan)} músicas</span>
          </span>
        </div>

        {/* Plans Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {PLANS.map(plan => {
            const isActive = currentPlan === plan.id
            const Icon = plan.icon
            return (
              <div 
                key={plan.id} 
                style={{ 
                  background: 'var(--bg-2)', 
                  borderRadius: '16px', 
                  padding: '28px', 
                  border: isActive ? `2px solid ${plan.color}` : plan.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 8px 32px ${plan.color}22`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Popular Badge */}
                {plan.popular && !isActive && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#000', padding: '4px 16px', 
                    borderRadius: '100px', fontSize: '12px', fontWeight: 700
                  }}>
                    Mais Popular
                  </div>
                )}
                
                {/* Active Badge */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#000', padding: '4px 16px', 
                    borderRadius: '100px', fontSize: '12px', fontWeight: 700
                  }}>
                    Plano Atual
                  </div>
                )}

                {/* Icon & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: plan.popular || isActive ? '8px' : '0' }}>
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${plan.color}22`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={22} color={plan.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: plan.color }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '24px' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {feat.included ? (
                        <Check size={16} color={plan.color} style={{ flexShrink: 0 }} />
                      ) : (
                        <X size={16} color="#555" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '13px', color: feat.included ? 'var(--text)' : 'var(--text-muted)' }}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  disabled={isActive}
                  onClick={() => {
                    if (isActive) return
                    alert(`Aqui abriria o checkout para o plano ${plan.name}. Integração com Stripe/MercadoPago pendente.`)
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px',
                    border: 'none', fontWeight: 700, fontSize: '14px', cursor: isActive ? 'default' : 'pointer',
                    background: isActive ? 'var(--bg-3)' : plan.color,
                    color: isActive ? 'var(--text-muted)' : '#000',
                    opacity: isActive ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = '1' }}
                >
                  {isActive ? 'Plano Atual' : plan.id === 'FREE' ? 'Plano Atual' : 'Assinar Agora'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Studio Pay-per-use Section */}
        <div style={{ 
          marginTop: '48px', padding: '32px', background: 'var(--bg-2)', 
          borderRadius: '16px', border: '1px solid var(--border)',
          maxWidth: '1100px', margin: '48px auto 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Sparkles size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Uso Avulso do Estúdio</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
            Não quer assinar o plano Advanced? Sem problema! Você pode comprar créditos individuais para usar o Estúdio e gerar músicas com tom alterado. O valor depende do seu plano atual:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { plan: 'Free', price: 'R$ 9,99', color: '#888' },
              { plan: 'Básico', price: 'R$ 7,99', color: '#3b82f6' },
              { plan: 'Intermediário', price: 'R$ 5,99', color: '#f59e0b' },
            ].map(item => (
              <div key={item.plan} style={{ 
                background: 'var(--bg-3)', padding: '20px', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Plano {item.plan}</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: item.color }}>{item.price}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>por geração</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
