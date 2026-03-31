import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { filename, contentType, size } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Preserva o nome do arquivo original para facilitar identificação no painel do Cloudflare R2
  // Substitui espaços por underline para evitar problemas de URL, e adiciona um timestamp curto
  const safeName = filename.replace(/\s+/g, '_')
  const uniquePrefix = Date.now().toString(36)
  const key = `songs/${session.user.id}/${uniquePrefix}_${safeName}`

  const uploadUrl = await getUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, key, size })
}
