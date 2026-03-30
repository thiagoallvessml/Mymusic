import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/r2'

// GET /api/songs - list user's songs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  const songs = await prisma.song.findMany({
    where: {
      userId: session.user.id,
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { artist: { contains: q, mode: 'insensitive' } },
          { album: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(songs)
}

// POST /api/songs - save song metadata after upload
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { title, artist, album, duration, fileKey, size, mimeType, genre, year, lyrics, coverUrl } = await req.json()

  if (!title || !artist || !fileKey) {
    return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 })
  }

  const song = await prisma.song.create({
    data: {
      title,
      artist,
      album,
      genre,
      year,
      lyrics,
      duration: duration || 0,
      fileKey,
      fileUrl: getPublicUrl(fileKey),
      coverUrl: coverUrl ? getPublicUrl(coverUrl) : null,
      size,
      mimeType,
      userId: session.user.id,
    },
  })

  return NextResponse.json(song, { status: 201 })
}
