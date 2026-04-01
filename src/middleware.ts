import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const path = req.nextUrl.pathname

  const isAuthPage = path === '/login' || path === '/register'
  
  // Páginas de auth (se já estiver logado, manda pro respectivo painel)
  if (isAuthPage) {
    if (isAuth) {
      if (token?.role === 'CHURCH') {
        return NextResponse.redirect(new URL('/church', req.url))
      }
      return NextResponse.redirect(new URL('/library', req.url))
    }
    return NextResponse.next()
  }

  // A partir daqui, todas as outras páginas que o middleware pega são protegidas
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Usuários do tipo CHURCH ficam restritos APENAS à rota /church
  if (isAuth && token?.role === 'CHURCH' && path !== '/church') {
    return NextResponse.redirect(new URL('/church', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
