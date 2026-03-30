import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isProtectedPath = req.nextUrl.pathname.startsWith('/library') || req.nextUrl.pathname.startsWith('/church') || req.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedPath && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuth && token?.role === 'CHURCH' && !req.nextUrl.pathname.startsWith('/church')) {
    return NextResponse.redirect(new URL('/church', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/library/:path*', '/dashboard/:path*', '/church/:path*'],
}
