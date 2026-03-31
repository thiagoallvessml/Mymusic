import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/songs/[id] - update song metadata
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verify ownership
    const song = await prisma.song.findUnique({ where: { id } })
    if (!song || song.userId !== session.user.id) {
      return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 })
    }

    const updated = await prisma.song.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.artist !== undefined && { artist: body.artist }),
        ...(body.album !== undefined && { album: body.album }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.lyrics !== undefined && { lyrics: body.lyrics }),
      }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('PATCH /api/songs/[id] error:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/songs/[id] - delete a song
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const song = await prisma.song.findUnique({ where: { id } })
    if (!song || song.userId !== session.user.id) {
      return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 })
    }

    await prisma.song.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/songs/[id] error:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
