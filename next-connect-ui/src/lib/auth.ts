import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { serverFetchAPI } from "./api"


export const getAuthSession = () => getServerSession(authOptions)

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Helper function to refresh access token
export async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken
      })
    })
    
    const refreshed = await response.json()
    
    if (!response.ok) {
      throw new Error(refreshed.detail || 'Failed to refresh token')
    }
    
    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      accessTokenExpires: Date.now() + (60 * 60 * 1000), // 1 hour from now
    }
  } catch (error) {
    console.error('Error refreshing access token', error)
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "string" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await serverFetchAPI(credentials.type === 'signup' ? '/auth/signup' : '/auth/signin', {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })
          
          const user = {
            id: response.user_id,
            email: response.email,
            name: response.name || response.email,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          }
          
          return user as any
        } catch (error: any) {
          // 이메일 확인이 필요한 경우를 처리
          if (credentials.type === 'signup' && error?.detail?.includes('check your email')) {
            throw new Error('EMAIL_VERIFICATION_REQUIRED')
          }
          // 사용자가 이미 존재하는 경우
          if (error?.detail?.includes('User already exists')) {
            throw new Error('USER_ALREADY_EXISTS')
          }
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + (60 * 60 * 1000), // 1 hour from now
        }
      }
      
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }
      
      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.accessToken = token.accessToken as string
        // Don't expose refresh token to client
        // Check for token refresh errors
        if (token.error) {
          session.error = token.error as string
        }
      }
      
      return session
    }
  },
  pages: {
    signIn: "/signin",
    error: "/error",
    newUser: "/signup",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async signOut(message) {
      // 로그아웃 시 추가 정리 작업
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
