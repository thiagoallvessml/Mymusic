import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        name: { label: 'Nome', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null

        // Try primary User login
        let user = await prisma.user.findUnique({
          where: { name: credentials.name },
        })

        if (user) {
          const valid = await bcrypt.compare(credentials.password, user.password)
          if (valid) return { id: user.id, email: user.email, name: user.name, role: user.role }
        }

        // Try Church-specific login
        const churchUser = await prisma.user.findUnique({
          where: { churchName: credentials.name }
        })

        if (churchUser && churchUser.churchPassword) {
          const valid = await bcrypt.compare(credentials.password, churchUser.churchPassword)
          if (valid) return { id: churchUser.id, email: churchUser.email, name: churchUser.name, role: 'CHURCH' }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
}
