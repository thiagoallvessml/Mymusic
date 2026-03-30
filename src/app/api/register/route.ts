import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const existsName = await prisma.user.findUnique({ where: { name } })
    if (existsName) {
      return NextResponse.json({ error: 'Este nome de usuário já está em uso' }, { status: 409 })
    }

    const existsEmail = await prisma.user.findUnique({ where: { email } })
    if (existsEmail) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
