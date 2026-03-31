import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { filename, contentType, size, isStudioAction } = await req.json()

    // Plan enforcement - wrapped in try/catch so uploads are never blocked if plan fields aren't in DB yet
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, studioCredits: true, _count: { select: { songs: true } } }
      })

      if (user) {
        if (isStudioAction) {
          if (user.plan !== 'ADVANCED' && user.studioCredits <= 0) {
            return NextResponse.json({ error: 'Você precisa do plano Advanced ou de créditos para usar o Estúdio.' }, { status: 402 })
          }
        } else {
          let limit = 2
          if (user.plan === 'BASIC') limit = 100
          if (user.plan === 'INTERMEDIATE') limit = 500
          if (user.plan === 'ADVANCED') limit = 99999999

          if (user._count.songs >= limit) {
            return NextResponse.json({ error: `Você atingiu o limite de ${limit} músicas do seu Plano ${user.plan}. Faça upgrade para continuar.` }, { status: 403 })
          }
        }
      }
    } catch (planErr) {
      console.error('Plan check failed, allowing upload:', planErr)
    }

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Preserva o nome do arquivo original para facilitar identificação no painel do Cloudflare R2
    const safeName = filename.replace(/\s+/g, '_')
    const uniquePrefix = Date.now().toString(36)
    const key = `songs/${session.user.id}/${uniquePrefix}_${safeName}`

    const uploadUrl = await getUploadUrl(key, contentType)

    return NextResponse.json({ uploadUrl, key, size })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
