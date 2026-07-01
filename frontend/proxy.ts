import { NextResponse, type NextRequest } from 'next/server'

const LOGIN_PATH = '/login'
const AUTH_COOKIE_NAMES = ['access_token', 'refresh_token']

function hasAuthCookie(request: NextRequest) {
  return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name))
}

export function proxy(request: NextRequest) {
  if (hasAuthCookie(request)) {
    return NextResponse.next()
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = LOGIN_PATH
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/customer/checkout',
    '/customer/checkout/:path*',
    '/customer/profile',
    '/customer/profile/:path*',
    '/customer/security',
    '/customer/security/:path*',
    '/customer/bookings',
    '/customer/bookings/:path*',
    '/customer/support',
    '/customer/support/:path*',
    '/customer/report-issue',
    '/customer/report-issue/:path*',
    '/customer/accessibility',
    '/customer/accessibility/:path*',
    '/profile/:path*',
    '/booking/confirmation/:path*',
  ],
}
