import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { churchName: true } as any
    }) as any

    return NextResponse.json({ churchName: user?.churchName || '' })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { churchName, churchPassword } = await req.json()

    // check if name is being used by someone else
    if (churchName) {
      const existing = await (prisma.user as any).findFirst({
        where: {
          OR: [
            { name: churchName },
            { churchName: churchName }
          ],
          NOT: { id: session.user.id }
        }
      })
      
      if (existing) {
        return NextResponse.json({ error: 'Este nome já está em uso' }, { status: 400 })
      }
    }

    const data: any = { churchName: churchName || null }
    if (churchPassword) {
      data.churchPassword = await bcrypt.hash(churchPassword, 12)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno ao salvar' }, { status: 500 })
  }
}
