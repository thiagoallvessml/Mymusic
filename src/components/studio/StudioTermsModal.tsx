'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'

interface StudioTermsModalProps {
  onAccept: () => void
}

export function StudioTermsModal({ onAccept }: StudioTermsModalProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.8)', padding: '24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: '16px', maxWidth: '600px', width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Termos de Uso do Estúdio</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px', marginBottom: 0 }}>
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '16px' }}>
            Bem-vindo(a) ao <strong>MyMusic3</strong>. Ao acessar e utilizar o Estúdio, você concorda com os termos abaixo.
          </p>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>1. Descrição do Serviço</h3>
          <p style={{ marginBottom: '16px' }}>
            O <strong>MyMusic3</strong> é uma plataforma online que permite ao usuário fazer upload de arquivos de áudio para processamento, incluindo alteração de tom (pitch), com finalidade de uso pessoal.
          </p>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>2. Responsabilidade do Usuário</h3>
          <p style={{ marginBottom: '8px' }}>Ao utilizar a plataforma, você declara que:</p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Possui todos os direitos necessários sobre os arquivos enviados</li>
            <li>Ou possui autorização do titular dos direitos autorais</li>
            <li>Não enviará conteúdos protegidos sem permissão</li>
            <li>Não utilizará o serviço para fins ilegais</li>
          </ul>
          <p style={{ marginBottom: '16px' }}>
            A responsabilidade sobre os arquivos enviados é <strong>exclusivamente do usuário</strong>.
          </p>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>3. Direitos Autorais</h3>
          <p style={{ marginBottom: '8px' }}>
            O <strong>MyMusic3</strong> não reivindica propriedade sobre os arquivos enviados pelos usuários. No entanto:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Não nos responsabilizamos por conteúdos enviados sem autorização</li>
            <li>Podemos remover qualquer conteúdo mediante notificação ou suspeita de violação</li>
            <li>Respeitamos leis de direitos autorais e responderemos a solicitações legais</li>
          </ul>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>4. Armazenamento de Arquivos</h3>
          <p style={{ marginBottom: '8px' }}>
            Os arquivos enviados podem ser armazenados temporariamente para processamento. A plataforma se reserva o direito de:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Excluir arquivos automaticamente após determinado período</li>
            <li>Limitar o tempo de armazenamento</li>
            <li>Remover arquivos sem aviso prévio</li>
          </ul>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>5. Uso Comercial</h3>
          <p style={{ marginBottom: '8px' }}>
            O serviço é pago e refere-se exclusivamente ao processamento técnico dos arquivos. A cobrança não concede ao usuário:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Direitos sobre obras protegidas</li>
            <li>Licença para uso comercial de músicas de terceiros</li>
          </ul>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>6. Limitação de Responsabilidade</h3>
          <p style={{ marginBottom: '8px' }}>
            A <strong>MyMusic3</strong> não se responsabiliza por:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Uso indevido da plataforma</li>
            <li>Violação de direitos autorais por usuários</li>
            <li>Perda de arquivos</li>
            <li>Danos diretos ou indiretos decorrentes do uso do serviço</li>
          </ul>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>7. Suspensão e Encerramento</h3>
          <p style={{ marginBottom: '8px' }}>
            Podemos suspender ou encerrar contas que:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Violarem estes termos</li>
            <li>Enviarem conteúdo ilegal</li>
            <li>Abusarem da plataforma</li>
          </ul>

          <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: '24px 0 8px' }}>8. Alterações nos Termos</h3>
          <p style={{ marginBottom: '16px' }}>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo da plataforma implica aceitação das alterações.
          </p>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '4px',
              border: '2px solid', borderColor: accepted ? 'var(--accent)' : 'var(--text-muted)',
              background: accepted ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '2px', transition: 'all 0.2s'
            }}>
              {accepted && <Check size={14} color="#000" strokeWidth={3} />}
            </div>
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={e => setAccepted(e.target.checked)} 
              style={{ display: 'none' }}
            />
            <span style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5, userSelect: 'none' }}>
              Li e concordo com os Termos de Uso e entendo que a responsabilidade pelas músicas alteradas é <strong>totalmente minha</strong>.
            </span>
          </label>

          <button
            disabled={!accepted}
            onClick={onAccept}
            style={{
              width: '100%', padding: '16px',
              background: accepted ? 'var(--accent)' : 'var(--border)',
              color: accepted ? '#000' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '16px',
              cursor: accepted ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            Continuar para o Estúdio
          </button>
        </div>
      </div>
    </div>
  )
}
