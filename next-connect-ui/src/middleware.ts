import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // 토큰 세션 만료 체크 및 리다이렉트 처리
    const token = req.nextauth?.token
    if (!token && !req.nextUrl.pathname.startsWith('/signin') && !req.nextUrl.pathname.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // 인증 관련 페이지는 항상 접근 가능
        if (pathname === '/signin' || pathname === '/signup') {
          return true
        }
        
        // 그 외 모든 페이지는 토큰이 있어야 접근 가능
        const result = !!token
        return result
      },
    },
    pages: {
      signIn: '/signin',
      signOut: '/signout',
      error: '/signin', // 인증 오류 발생 시 로그인 페이지로 리다이렉트
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}