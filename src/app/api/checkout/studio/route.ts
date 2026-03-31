import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // SIMULAÇÃO: Aprova o pagamento e adiciona 1 crédito ao usuário
  // No mundo real, isso seria um Webhook do Stripe confirmando o checkout.session.completed

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { studioCredits: { increment: 1 } },
    })

    return NextResponse.json({ success: true, credits: user.studioCredits })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
